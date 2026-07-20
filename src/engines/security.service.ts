/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { Issue } from '../analyze/interfaces/issue.interface';
import { IGNORED_DIRS } from './ignored-dirs-constants';

@Injectable()
export class SecurityService {
  async analyze(sourcePath: string): Promise<Issue[]> {
    const files = this.collectSourceFiles(sourcePath);

    const issues: Issue[] = [];

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf8');

      issues.push(...this.detectHardcodedSecrets(filePath, content));
    }

    return issues;
  }

  private collectSourceFiles(root: string): string[] {
    const results: string[] = [];

    const entries = fs.readdirSync(root, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(root, entry.name);

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.includes(entry.name)) {
          continue;
        }

        results.push(...this.collectSourceFiles(fullPath));
      } else if (entry.isFile()) {
        if (/\.(ts|js|json|env)$/i.test(entry.name)) {
          results.push(fullPath);
        }
      }
    }

    return results;
  }

  private detectHardcodedSecrets(filePath: string, content: string): Issue[] {
    const issues: Issue[] = [];
    const lines = content.split('\n');

    const secretPatterns: { regex: RegExp; ruleId: string; message: string }[] =
      [
        {
          // eslint-disable-next-line no-useless-escape
          regex: /(api[_-]?key)\s*[:=]\s*['"][0-9a-zA-Z_\-]{16,}['"]/i,
          ruleId: 'hardcoded-api-key',
          message: 'Possible hardcoded API key detected',
        },
        {
          regex: /(secret|token|password)\s*[:=]\s*['"][^'"]{8,}['"]/i,
          ruleId: 'hardcoded-secret',
          message: 'Possible hardcoded secret/token/password detected',
        },
        {
          regex:
            /['"][A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}['"]/,
          ruleId: 'hardcoded-jwt',
          message: 'Possible JWT token hardcoded in source',
        },
        {
          regex: /(AKIA|ASIA)[0-9A-Z]{16}/,
          ruleId: 'hardcoded-aws-access-key',
          message: 'Possible AWS access key ID detected',
        },
      ];

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
        return;
      }

      for (const pattern of secretPatterns) {
        if (pattern.regex.test(line)) {
          issues.push({
            engine: 'security-service',
            type: 'security',
            severity: 'medium',
            ruleId: pattern.ruleId,
            message: `${pattern.message} in ${path.basename(filePath)}`,
            file: filePath,
            line: index + 1,
          });
          break;
        }
      }
    });

    return issues;
  }
}
