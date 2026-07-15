import { RulesConfig } from '../interfaces/rules-config.interface';

export const DEFAULT_RULES_CONFIG: RulesConfig = {
  baseScore: 100,
  duplicationWeight: 2,
  severityWeights: {
    critical: 15,
    high: 8,
    medium: 3,
    low: 1,
    info: 0,
  },
  passThreshold: 70,
};
