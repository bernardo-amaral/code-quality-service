/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  PackageDependency,
  VulnerableDependency,
} from './interfaces/dependency-result.interface';
import { Issue } from 'src/analyze/interfaces/issue.interface';

const OSV_API = 'https://api.osv.dev/v1/querybatch';

@Injectable()
export class DependencyScannerService {
  private readonly logger = new Logger(DependencyScannerService.name);

  /**
   *
   * @param projectRoot
   * @returns
   */
  async scanPackageJson(projectRoot: string): Promise<Issue[]> {
    const packageJsonPath = path.join(projectRoot, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      this.logger.warn(`package.json not found at: ${packageJsonPath}`);
      return [];
    }

    const raw = fs.readFileSync(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(raw);

    const deps = this.extractDependencies(pkg);

    if (deps.length === 0) {
      return [];
    }

    const vulnerableDependencies = await this.queryOsvBatch(deps);

    return this.formatVulnerabilitiesToIssues(
      projectRoot,
      vulnerableDependencies,
    );
  }

  /**
   *
   * @param pkg
   * @returns
   */
  private extractDependencies(pkg: any): PackageDependency[] {
    const result: PackageDependency[] = [];

    const addDeps = (section: string, dev: boolean) => {
      const deps = pkg[section];
      if (!deps || typeof deps !== 'object') {
        return;
      }

      for (const [name, spec] of Object.entries(
        deps as Record<string, string>,
      )) {
        result.push({ name, version: String(spec), dev });
      }
    };

    addDeps('dependencies', false);
    addDeps('devDependencies', true);

    return result;
  }

  /**
   *
   * @param deps
   * @returns
   */
  private async queryOsvBatch(
    deps: PackageDependency[],
  ): Promise<VulnerableDependency[]> {
    const queries = deps.map((dep) => ({
      package: {
        name: dep.name,
        ecosystem: 'npm',
      },
      version: dep.version,
    }));

    try {
      const response = await fetch(OSV_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ queries }),
      });

      if (!response.ok) {
        this.logger.warn(
          `OSV querybatch failed with status ${response.status}`,
        );
        return [];
      }

      const data: any = await response.json();

      const vulnerable: VulnerableDependency[] = [];

      (data?.results || []).forEach((result: any, index: number) => {
        const vulns = result.vulns || result.vulnerabilities || [];
        if (!Array.isArray(vulns) || vulns.length === 0) {
          return;
        }

        const dep = deps[index];

        vulnerable.push({
          name: dep.name,
          version: dep.version,
          vulnerabilities: vulns.map((v: any) => ({
            id: v.id,
            summary: v.summary,
            severity: v.severity,
          })),
        });
      });

      return vulnerable;
    } catch (error) {
      this.logger.error('Error querying OSV API', error as Error);
      return [];
    }
  }

  /**
   *
   * @param projectRoot
   * @param vulnerableDependencies
   * @returns
   */
  private formatVulnerabilitiesToIssues(
    projectRoot: string,
    vulnerableDependencies: VulnerableDependency[],
  ): Issue[] {
    return vulnerableDependencies.flatMap((dep) =>
      dep.vulnerabilities.map((vuln) => ({
        engine: 'osv-scanner',
        type: 'dependency',
        severity: this.mapSeverity(vuln.severity),
        ruleId: `osv-${vuln.id}`,
        message: `Dependency ${dep.name}@${dep.version} is affected by ${vuln.id}${
          vuln.summary ? `: ${vuln.summary}` : ''
        }`,
        file: 'package.json',
        line: this.getDependencyLineNumber(projectRoot, dep.name, dep.version),
      })),
    );
  }

  /**
   *
   * @param severity
   * @returns
   */
  private mapSeverity(severity?: string): Issue['severity'] {
    if (!severity) {
      return 'medium';
    }

    const s = severity.toLowerCase();
    if (s.includes('critical')) return 'critical';
    if (s.includes('high')) return 'high';
    if (s.includes('medium')) return 'medium';
    if (s.includes('low')) return 'low';

    return 'medium';
  }

  /**
   *
   * @param projectRoot
   * @param depName
   * @param depVersion
   * @returns
   */
  private getDependencyLineNumber(
    projectRoot: string,
    depName: string,
    depVersion: string,
  ): number {
    try {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const content = fs.readFileSync(packageJsonPath, 'utf-8');

      const lines = content.split(/\r?\n/);

      const needle = `"${depName}": "${depVersion}"`;

      const index = lines.findIndex((line) => line.includes(needle));

      if (index === -1) {
        const fallbackIndex = lines.findIndex((line) =>
          line.includes(`"${depName}":`),
        );
        return fallbackIndex === -1 ? 0 : fallbackIndex + 1;
      }

      return index + 1;
    } catch {
      return 0;
    }
  }
}
