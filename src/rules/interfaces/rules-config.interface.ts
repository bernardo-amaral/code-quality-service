export interface SeverityWeights {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface RulesConfig {
  baseScore: number;
  duplicationWeight: number;
  severityWeights: SeverityWeights;
  passThreshold: number;
}
