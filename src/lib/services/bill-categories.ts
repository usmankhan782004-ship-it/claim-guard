// ─── ClaimGuard Bill Categories ──────────────────────────────
// Shared types and metadata for multi-category bill analysis.
// ──────────────────────────────────────────────────────────────

export type BillCategory = "medical" | "auto" | "rent" | "utility";

export interface FlaggedItem {
    code: string; // CPT code, policy item, fee name, or billing period
    description: string;
    billedAmount: number;
    fairPrice: number;
    savings: number;
    confidence: number;
}

export interface UnifiedAnalysisResult {
    category: BillCategory;
    disputeType: string; // "Medical Bill Overcharge", "Premium Hike", etc.
    lineItems: FlaggedItem[];
    totalBilled: number;
    totalFairPrice: number;
    potentialSavings: number;
    providerName: string | null;
    analysisNotes: string;
}

export interface CategoryMeta {
    id: BillCategory;
    label: string;
    icon: string; // lucide icon name
    tagline: string;
    scanDescription: string;
    accentColor: string;
}

export const CATEGORIES: CategoryMeta[] = [
    {
        id: "medical",
        label: "Medical",
        icon: "Heart",
        tagline: "Hospital & Doctor Bills",
        scanDescription: "Scans CPT/HCPCS codes against CMS Medicare Fee Schedule",
        accentColor: "#10b981",
    },
    {
        id: "auto",
        label: "Auto Insurance",
        icon: "Car",
        tagline: "Car Insurance Premiums",
        scanDescription: "Detects premium hikes and cross-references state rate averages",
        accentColor: "#3b82f6",
    },
    {
        id: "rent",
        label: "Rent / Lease",
        icon: "Home",
        tagline: "Rental & Housing Fees",
        scanDescription: "Flags hidden fees and illegal late charges per tenant rights",
        accentColor: "#f59e0b",
    },
    {
        id: "utility",
        label: "Gas / Heating",
        icon: "Flame",
        tagline: "Utility & Heating Bills",
        scanDescription: "Checks for back-billing errors and estimated meter fraud",
        accentColor: "#ef4444",
    },
];

// ─── Demo Bills per Category ─────────────────────────────────
export const DEMO_BILLS: Record<BillCategory, string> = {
    medical: `
MEMORIAL GENERAL HOSPITAL
Statement of Services
Patient: Jane Smith
Date of Service: 01/15/2024
Account #: MGH-2024-00847

Code     Description                              Amount
------   ---------------------------------------- ----------
99285    Emergency dept visit (life-threatening)   $2,450.00
36415    Venipuncture (blood draw)                 $85.00
85025    Complete blood count with differential    $147.00
80053    Comprehensive metabolic panel             $235.00
71046    Chest X-ray, 2 views                      $380.00
93000    Electrocardiogram (ECG/EKG) complete      $275.00
96372    Therapeutic injection (IM/SubQ)            $185.00
74177    CT abdomen and pelvis with contrast        $3,200.00
88305    Surgical pathology, gross and micro        $450.00

Subtotal:                                          $7,407.00
Facility Fee:                                      $1,850.00
Total Charges:                                     $9,257.00
`,

    auto: `
NATIONAL SHIELD AUTO INSURANCE
Policy Renewal Notice
Policyholder: John Smith
Policy #: NS-AUTO-2024-55912
Renewal Date: 03/01/2024
Vehicle: 2021 Honda Civic EX

Coverage              Previous Premium   New Premium
--------------------  ----------------   -----------
Bodily Injury         $280.00/6mo        $412.00/6mo
Property Damage       $145.00/6mo        $198.00/6mo
Collision             $310.00/6mo        $485.00/6mo
Comprehensive         $125.00/6mo        $189.00/6mo
Uninsured Motorist    $65.00/6mo         $94.00/6mo
Medical Payments      $40.00/6mo         $58.00/6mo

Previous 6-Month Premium:                 $965.00
New 6-Month Premium:                      $1,436.00
Increase:                                 $471.00 (48.8%)

No claims filed in the past 24 months.
No moving violations on record.
Credit score: 780 (Excellent)
`,

    rent: `
GREENFIELD PROPERTY MANAGEMENT
Monthly Rent Statement
Tenant: Sarah Johnson
Unit: Apt 4B, 1250 Oak Street
Lease Period: 01/01/2024 - 12/31/2024

Charge                          Amount
------------------------------  ----------
Base Rent                       $1,850.00
Amenity Fee                     $125.00
Trash Removal Fee               $45.00
Water/Sewer Charge              $68.00
Parking Fee (1 spot)            $150.00
Pet Rent (1 cat)                $75.00
Admin/Processing Fee            $35.00
Digital Access Fee              $20.00
Late Fee (paid 2 days past due) $185.00
Insurance Requirement Fee       $15.00

Total Due:                      $2,568.00

Late Fee Policy: $185 flat fee if rent received after the 1st.
Grace Period: None stated.
`,

    utility: `
METRO GAS & HEATING CO.
Account Statement
Customer: Michael Chen
Account #: MG-2024-88341
Service Address: 442 Pine Drive

Billing Period        Usage (therms)  Rate       Amount
--------------------  -------------   --------   ----------
Jan 2023 (estimated)     145          $1.45/th    $210.25
Feb 2023 (estimated)     138          $1.45/th    $200.10
Mar 2023 (estimated)     112          $1.45/th    $162.40
Apr 2023 (estimated)      85          $1.45/th    $123.25
May 2023 (estimated)      42          $1.45/th    $60.90
Jun 2023 (estimated)      18          $1.45/th    $26.10
Jul 2023 (estimated)      12          $1.45/th    $17.40
Aug 2023 (estimated)      10          $1.45/th    $14.50
Sep 2023 (estimated)      28          $1.45/th    $40.60
Oct 2023 (estimated)      72          $1.45/th    $104.40
Nov 2023 (estimated)     118          $1.45/th    $171.10
Dec 2023 (estimated)     140          $1.45/th    $203.00
Jan 2024 (actual)        132          $1.62/th    $213.84
Feb 2024 (actual)        128          $1.62/th    $207.36

Back-Bill Adjustment:                              $1,334.00
Service Fee:                                       $18.50/mo
Total Amount Due:                                  $2,807.20

Note: Back-bill reflects corrected estimated readings from
Jan 2023 - Dec 2023. Meter was replaced Dec 28, 2023.
`,
};
