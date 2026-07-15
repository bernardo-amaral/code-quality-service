import { Issue } from '../../analyze/interfaces/issue.interface';

export interface RulesEvaluation {
  score: number;
  passed: boolean;
  threshold: number;
  breakdown: {
    duplicationPenalty: number;
    issuesPenalty: number;
    issuesBySeverity: Record<string, number>;
  };
}
