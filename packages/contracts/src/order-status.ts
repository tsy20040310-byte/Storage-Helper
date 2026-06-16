export type OrderStatus =
  | "draft"
  | "published"
  | "applied"
  | "candidate_pool_full"
  | "awaiting_client_confirmation"
  | "locked"
  | "in_service"
  | "awaiting_completion_confirmation"
  | "completed"
  | "cancelled"
  | "disputed";
