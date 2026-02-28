// ─── Type Exports ────────────────────────────────────────────
export type BillStatus =
  | "uploaded"
  | "analyzing"
  | "analyzed"
  | "disputing"
  | "resolved"
  | "failed";

export type NegotiationStatus =
  | "identified"
  | "disputing"
  | "won"
  | "lost"
  | "partial";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded";

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  total_saved: number;
  fees_paid: number;
  fees_owed: number;
  created_at: string;
  updated_at: string;
}

export interface Bill {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_url: string | null;
  file_type: string;
  status: BillStatus;
  raw_text: string | null;
  provider_name: string | null;
  total_billed: number | null;
  total_fair: number | null;
  potential_savings: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Negotiation {
  id: string;
  bill_id: string;
  user_id: string;
  cpt_code: string;
  description: string;
  billed_amount: number;
  fair_price: number;
  savings: number;
  confidence: number;
  status: NegotiationStatus;
  dispute_letter: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  bill_id: string;
  session_id: string;
  amount: number;
  fee_percentage: number;
  status: PaymentStatus;
  card_last_four: string | null;
  card_brand: string | null;
  processor: string;
  error_message: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}
