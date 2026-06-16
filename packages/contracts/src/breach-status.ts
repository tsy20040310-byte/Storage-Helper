export type BreachType =
  | "client_cancel_late"
  | "client_no_show"
  | "organizer_no_show"
  | "organizer_late"
  | "organizer_cancel_late";

export type BreachStatus = "pending" | "processed" | "waived";
