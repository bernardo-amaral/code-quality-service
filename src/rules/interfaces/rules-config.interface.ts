import { IssueSeverity } from 'src/analyze/interfaces/issue.interface';

export interface SeverityWeights {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface RulesConfig {
  baseScore: number;
  passThreshold: number;
  duplicationWeight: number;
  severityWeights: Record<IssueSeverity, number>;
  typeMultipliers: {
    dependency: number;
    quality: number;
  };
}
