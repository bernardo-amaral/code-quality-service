#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { NestFactory } from '@nestjs/core';
import { AnalyzeModule } from '../analyze/analyze.module';
import { AnalyzeService } from '../analyze/analyze.service';
import path from 'node:path';
import fs from 'node:fs';
import { printStartupBanner } from '../common/startup-banner';
import { version } from '../../package.json';

function inferProjectId(targetPath: string): string {
  const pkgPath = path.join(targetPath, 'package.json');

  if (fs.existsSync(pkgPath)) {
    try {
      const raw = fs.readFileSync(pkgPath, 'utf8');
      const pkg = JSON.parse(raw);
      if (typeof pkg.name === 'string' && pkg.name.trim().length > 0) {
        return pkg.name;
      }
    } catch (err) {
      console.warn(`Could not read package.json at ${pkgPath}:`, err);
    }
  }

  return path.basename(targetPath);
}

async function main() {
  const args = process.argv.slice(2);
  const targetPath = args[1] ?? process.cwd();

  const projectId = inferProjectId(targetPath);

  printStartupBanner({
    appName: 'Batmanuel',
    version,
    environment: 'cli',
    port: 0,
    swaggerUrl: undefined,
  });

  const app = await NestFactory.createApplicationContext(AnalyzeModule, {
    logger: false,
  });

  const analyzeService = app.get(AnalyzeService);

  const result = await analyzeService.analyze({
    sourcePath: targetPath || '.',
    projectId,
  });

  console.log(JSON.stringify(result, null, 2));

  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
