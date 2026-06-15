export type OrderStatus =
  | "draft"
  | "published"
  | "applied"
  | "awaiting_client_confirmation"
  | "locked"
  | "in_service"
  | "awaiting_completion_confirmation"
  | "completed"
  | "cancelled"
  | "disputed";
