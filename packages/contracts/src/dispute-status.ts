export type DisputeStatus = "open" | "in_review" | "resolved" | "rejected";

export type DisputeResolutionType =
  | "complaint_upheld"
  | "harassment"
  | "severe_violation"
  | "no_fault"
  | "settlement";
