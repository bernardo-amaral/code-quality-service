/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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

  /**
   *
   * @param duplicationPercentage
   * @param issues
   * @returns
   */
  evaluate(duplicationPercentage: number, issues: Issue[]): RulesEvaluation {
    const duplicationPenalty = this.calculateDuplicationPenalty(
      duplicationPercentage,
    );
    const {
      penalty: issuesPenalty,
      bySeverity,
      byType,
    } = this.calculateIssuesPenalty(issues);

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
        issuesByType: byType,
      },
    };
  }

  /**
   *
   * @param duplicationPercentage
   * @returns
   */
  private calculateDuplicationPenalty(duplicationPercentage: number): number {
    return duplicationPercentage * this.config.duplicationWeight;
  }

  /**
   *
   * @param issues
   * @returns
   */
  private calculateIssuesPenalty(issues: Issue[]): {
    penalty: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  } {
    const bySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    const byType: Record<string, number> = {};

    let penalty = 0;

    for (const issue of issues) {
      const severityWeight = this.getWeightForSeverity(issue.severity);
      const typeMultiplier = this.config.typeMultipliers[issue.type] ?? 1.0;

      const issuePenalty = severityWeight * typeMultiplier;
      penalty += issuePenalty;

      bySeverity[issue.severity] = (bySeverity[issue.severity] ?? 0) + 1;
      byType[issue.type] = (byType[issue.type] ?? 0) + 1;
    }

    return { penalty, bySeverity, byType };
  }
  /**
   *
   * @param severity
   * @returns
   */
  private getWeightForSeverity(severity: IssueSeverity): number {
    return this.config.severityWeights[severity] ?? 0;
  }
}
