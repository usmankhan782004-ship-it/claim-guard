/**
 * Ghost Hunter — StatementAnalyzer Service
 *
 * Parses CSV bank/credit card statements, detects recurring payments,
 * and flags price increases exceeding 10% month-over-month.
 */

export interface StatementRow {
    date: string;
    description: string;
    amount: number;
    category?: string;
}

export interface RecurringCharge {
    description: string;
    normalizedName: string;
    occurrences: { date: string; amount: number }[];
    avgAmount: number;
    latestAmount: number;
    monthOverMonthChange: number | null; // percentage
    flagged: boolean; // >10% increase
}

export interface StatementAnalysis {
    totalTransactions: number;
    totalSpent: number;
    recurring: RecurringCharge[];
    flaggedCount: number;
    potentialOvercharges: number; // $ amount of excess above baseline
}

// ─── CSV Parser ─────────────────────────────────────────────
export function parseCSV(raw: string): StatementRow[] {
    const lines = raw.trim().split("\n");
    if (lines.length < 2) return [];

    const header = lines[0].toLowerCase();
    const cols = header.split(",").map((c) => c.trim().replace(/"/g, ""));

    // Heuristic column detection
    const dateIdx = cols.findIndex((c) => /date/i.test(c));
    const descIdx = cols.findIndex((c) => /desc|merchant|name|memo|payee/i.test(c));
    const amtIdx = cols.findIndex((c) => /amount|debit|charge|total/i.test(c));
    const catIdx = cols.findIndex((c) => /category|type/i.test(c));

    if (dateIdx === -1 || amtIdx === -1) return [];

    const rows: StatementRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        const parts = splitCSVLine(lines[i]);
        if (parts.length <= Math.max(dateIdx, amtIdx)) continue;

        const rawAmt = parts[amtIdx]?.replace(/[$",]/g, "").trim();
        const amount = Math.abs(parseFloat(rawAmt));
        if (isNaN(amount) || amount === 0) continue;

        rows.push({
            date: parts[dateIdx]?.replace(/"/g, "").trim() || "",
            description: (descIdx >= 0 ? parts[descIdx] : parts[1])?.replace(/"/g, "").trim() || "Unknown",
            amount,
            category: catIdx >= 0 ? parts[catIdx]?.replace(/"/g, "").trim() : undefined,
        });
    }

    return rows;
}

// Handle quoted CSV fields with commas inside
function splitCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const ch of line) {
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === "," && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

// ─── Normalize merchant names ───────────────────────────────
function normalizeName(desc: string): string {
    return desc
        .toLowerCase()
        .replace(/[#*\d]+$/g, "")         // strip trailing numbers/refs
        .replace(/\s{2,}/g, " ")
        .replace(/(pos|ach|debit|credit|payment|autopay|recurring)\s*/gi, "")
        .replace(/\s*(llc|inc|corp|ltd)\s*/gi, "")
        .trim();
}

// ─── Detect Recurring Charges ───────────────────────────────
function detectRecurring(rows: StatementRow[]): RecurringCharge[] {
    const groups = new Map<string, { date: string; amount: number; rawDesc: string }[]>();

    for (const row of rows) {
        const key = normalizeName(row.description);
        if (!key) continue;
        const existing = groups.get(key) || [];
        existing.push({ date: row.date, amount: row.amount, rawDesc: row.description });
        groups.set(key, existing);
    }

    const recurring: RecurringCharge[] = [];

    for (const [key, entries] of groups.entries()) {
        if (entries.length < 2) continue; // need at least 2 to be "recurring"

        // Sort by date ascending
        entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const amounts = entries.map((e) => e.amount);
        const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
        const latest = amounts[amounts.length - 1];
        const previous = amounts[amounts.length - 2];

        const momChange = previous > 0 ? ((latest - previous) / previous) * 100 : null;
        const flagged = momChange !== null && momChange > 10;

        recurring.push({
            description: entries[entries.length - 1].rawDesc,
            normalizedName: key,
            occurrences: entries.map((e) => ({ date: e.date, amount: e.amount })),
            avgAmount: Math.round(avg * 100) / 100,
            latestAmount: latest,
            monthOverMonthChange: momChange !== null ? Math.round(momChange * 10) / 10 : null,
            flagged,
        });
    }

    // Sort: flagged first, then by latest amount descending
    recurring.sort((a, b) => {
        if (a.flagged !== b.flagged) return a.flagged ? -1 : 1;
        return b.latestAmount - a.latestAmount;
    });

    return recurring;
}

// ─── Main Analysis ──────────────────────────────────────────
export function analyzeStatement(csvText: string): StatementAnalysis {
    const rows = parseCSV(csvText);
    const recurring = detectRecurring(rows);
    const flaggedCount = recurring.filter((r) => r.flagged).length;

    // Potential overcharges = sum of (latest - avg) for flagged items
    const potentialOvercharges = recurring
        .filter((r) => r.flagged)
        .reduce((sum, r) => sum + Math.max(0, r.latestAmount - r.avgAmount), 0);

    return {
        totalTransactions: rows.length,
        totalSpent: Math.round(rows.reduce((s, r) => s + r.amount, 0) * 100) / 100,
        recurring,
        flaggedCount,
        potentialOvercharges: Math.round(potentialOvercharges * 100) / 100,
    };
}
