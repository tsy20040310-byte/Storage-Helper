export type OrganizerProfileTagType = "style" | "service" | "badge";

export type MatchScoreBreakdown = {
  styleScore: number;
  distanceScore: number;
  reputationScore: number;
  ratingScore: number;
  responseRateScore: number;
  totalScore: number;
  matchedStyleTags: string[];
  matchedServiceTags: string[];
  matchedBadges: string[];
};
