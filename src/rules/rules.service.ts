import { Injectable, Inject } from '@nestjs/common';
import { Issue, IssueSeverity } from '../analyze/interfaces/issue.interface';
import * as rulesConfigInterface from './interfaces/rules-config.interface';
import { RulesEvaluation } from './interfaces/rules-evaluation.interface';
import { DEFAULT_RULES_CONFIG } from './config/default-rules.config';
import { RULES_CONFIG } from './rules.constants';

@Injectable()
export class RulesService {
  constructor(
    @Inject(RULES_CONFIG)
    private readonly config: rulesConfigInterface.RulesConfig = DEFAULT_RULES_CONFIG,
  ) {}

  evaluate(duplicationPercentage: number, issues: Issue[]): RulesEvaluation {
    const duplicationPenalty = this.calculateDuplicationPenalty(
      duplicationPercentage,
    );
    const { penalty: issuesPenalty, bySeverity } =
      this.calculateIssuesPenalty(issues);

    const rawScore = this.config.baseScore - duplicationPenalty - issuesPenalty;
    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    return {
      score,
      passed: score >= this.config.passThreshold,
      threshold: this.config.passThreshold,
      breakdown: {
        duplicationPenalty,
        issuesPenalty,
        issuesBySeverity: bySeverity,
      },
    };
  }

  private calculateDuplicationPenalty(duplicationPercentage: number): number {
    return duplicationPercentage * this.config.duplicationWeight;
  }

  private calculateIssuesPenalty(issues: Issue[]): {
    penalty: number;
    bySeverity: Record<string, number>;
  } {
    const bySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    let penalty = 0;

    for (const issue of issues) {
      const weight = this.getWeightForSeverity(issue.severity);
      penalty += weight;
      bySeverity[issue.severity] = (bySeverity[issue.severity] ?? 0) + 1;
    }

    return { penalty, bySeverity };
  }

  private getWeightForSeverity(severity: IssueSeverity): number {
    return this.config.severityWeights[severity] ?? 0;
  }
}
