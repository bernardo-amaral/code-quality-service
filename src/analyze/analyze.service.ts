/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { AnalyzeRequestDto } from './dto/analyze-request.dto';
import { AnalysisReport } from './interfaces/analysis-report.interface';
import { Issue } from './interfaces/issue.interface';
import { DuplicationService } from '../engines/duplication.service';
import { RulesService } from 'src/rules/rules.service';

@Injectable()
export class AnalyzeService {
  constructor(
    private readonly duplicationService: DuplicationService,
    private readonly rulesService: RulesService,
  ) {}

  /**
   *
   * @param dto
   * @returns
   */
  async analyze(dto: AnalyzeRequestDto): Promise<AnalysisReport> {
    const branch = dto.branch ?? 'main';
    const commit = dto.commit ?? 'unknown-commit';
    const sourcePath = dto.sourcePath;

    const duplicationResult =
      await this.duplicationService.analyzeDirectory(sourcePath);

    const duplicationIssues: Issue[] = duplicationResult.duplicates.map(
      (block) => ({
        engine: 'duplication-service',
        type: 'quality',
        severity: block.lines >= 10 ? 'high' : 'medium',
        ruleId: 'duplicate-code',
        message: `Duplicated block found between ${block.firstFile}:${block.firstFileStart} and ${block.secondFile}:${block.secondFileStart}`,
        file: block.secondFile,
        line: block.secondFileStart,
      }),
    );

    const issues: Issue[] = [...duplicationIssues];

    const evaluation = this.rulesService.evaluate(
      duplicationResult.duplicationPercentage,
      issues,
    );

    return {
      projectId: dto.projectId,
      branch,
      commit,
      timestamp: new Date().toISOString(),
      score: evaluation.score,
      passed: evaluation.passed,
      threshold: evaluation.threshold,
      metrics: {
        securityCritical: evaluation.breakdown.issuesBySeverity.critical ?? 0,
        securityHigh: evaluation.breakdown.issuesBySeverity.high ?? 0,
        securityMedium: evaluation.breakdown.issuesBySeverity.medium ?? 0,
        qualitySmells: 0,
        duplications: duplicationResult.duplicates.length,
        outdatedDeps: 0,
      },
      issues,
    };
  }

  /**
   *
   * @param projectId
   * @returns
   */
  getSummary(projectId: string) {
    return {
      projectId,
      lastScore: 0,
      trend: [],
      lastAnalysisAt: new Date().toISOString(),
    };
  }
}
