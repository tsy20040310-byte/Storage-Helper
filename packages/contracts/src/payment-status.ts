export type PaymentStatus = "pending" | "paid" | "escrowed" | "released" | "refunded";

export type EscrowStatus = "holding" | "released" | "refunded";

export type TransactionType =
  | "payment"
  | "escrow"
  | "release"
  | "refund"
  | "commission"
  | "deposit_deduction"
  | "deposit_refund"
  | "breach_compensation";
