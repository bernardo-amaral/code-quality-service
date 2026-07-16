import { RulesConfig } from '../interfaces/rules-config.interface';

export const DEFAULT_RULES_CONFIG: RulesConfig = {
  baseScore: 100,
  passThreshold: 80,
  duplicationWeight: 0.5,
  severityWeights: {
    critical: 20,
    high: 10,
    medium: 5,
    low: 2,
    info: 0,
  },
  typeMultipliers: {
    dependency: 1.5,
    quality: 1.0,
  },
};
