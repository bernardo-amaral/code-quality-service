export interface RulesEvaluation {
  score: number;
  passed: boolean;
  threshold: number;
  breakdown: {
    duplicationPenalty: number;
    issuesPenalty: number;
    issuesBySeverity: Record<string, number>;
    issuesByType: Record<string, number>;
  };
}
