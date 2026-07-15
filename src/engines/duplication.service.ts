/* eslint-disable @typescript-eslint/require-await */
import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import {
  DuplicationBlock,
  DuplicationResult,
} from './interfaces/duplication-result.interface';

interface NormalizedFile {
  filePath: string;
  lines: string[];
}

// Minimum consecutive lines to consider a duplication block.
const MIN_BLOCK_SIZE = 5;

@Injectable()
export class DuplicationService {
  private readonly logger = new Logger(DuplicationService.name);

  /**
   *
   * @param rootDir
   * @param extensions
   * @param ignorePatterns
   * @returns
   */
  async analyzeDirectory(
    rootDir: string,
    extensions: string[] = ['.ts', '.js'],
    ignorePatterns: string[] = ['node_modules', 'dist', '.git', 'coverage'],
  ): Promise<DuplicationResult> {
    const filePaths = this.collectFiles(rootDir, extensions, ignorePatterns);
    const files = filePaths.map((filePath) => this.readAndNormalize(filePath));

    return this.detectDuplicates(files);
  }

  /**
   *
   * @param files
   * @returns
   */
  detectDuplicates(files: NormalizedFile[]): DuplicationResult {
    const blockIndex = new Map<
      string,
      { filePath: string; startLine: number }[]
    >();
    const duplicates: DuplicationBlock[] = [];
    const seenPairs = new Set<string>();

    let totalLines = 0;

    for (const file of files) {
      totalLines += file.lines.length;

      for (let i = 0; i <= file.lines.length - MIN_BLOCK_SIZE; i++) {
        const block = file.lines.slice(i, i + MIN_BLOCK_SIZE);
        const normalizedBlock = block.join('\n').trim();

        if (normalizedBlock.length === 0) continue;

        const hash = this.hashBlock(normalizedBlock);
        const occurrences = blockIndex.get(hash) ?? [];

        for (const occurrence of occurrences) {
          const pairKey = this.buildPairKey(
            occurrence.filePath,
            occurrence.startLine,
            file.filePath,
            i,
          );

          if (seenPairs.has(pairKey)) continue;
          seenPairs.add(pairKey);

          duplicates.push({
            firstFile: occurrence.filePath,
            firstFileStart: occurrence.startLine + 1,
            firstFileEnd: occurrence.startLine + MIN_BLOCK_SIZE,
            secondFile: file.filePath,
            secondFileStart: i + 1,
            secondFileEnd: i + MIN_BLOCK_SIZE,
            lines: MIN_BLOCK_SIZE,
            tokens: normalizedBlock.split(/\s+/).length,
            fragment: normalizedBlock,
          });
        }

        occurrences.push({ filePath: file.filePath, startLine: i });
        blockIndex.set(hash, occurrences);
      }
    }

    const duplicatedLines = duplicates.length * MIN_BLOCK_SIZE;
    const duplicationPercentage =
      totalLines > 0
        ? Math.round((duplicatedLines / totalLines) * 10000) / 100
        : 0;

    return {
      totalFilesAnalyzed: files.length,
      duplicatedLines,
      totalLines,
      duplicationPercentage,
      duplicates,
    };
  }

  /**
   *
   * @param filePath
   * @returns
   */
  private readAndNormalize(filePath: string): NormalizedFile {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map((line) => this.normalizeLine(line));
    return { filePath, lines };
  }

  /**
   *
   * @param line
   * @returns
   */
  private normalizeLine(line: string): string {
    return line
      .trim()
      .replace(/\/\/.*$/, '')
      .replace(/\s+/g, ' ');
  }

  /**
   *
   * @param block
   * @returns
   */
  private hashBlock(block: string): string {
    let hash = 0;
    for (let i = 0; i < block.length; i++) {
      hash = (hash << 5) - hash + block.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString();
  }

  /**
   *
   * @param fileA
   * @param startA
   * @param fileB
   * @param startB
   * @returns
   */
  private buildPairKey(
    fileA: string,
    startA: number,
    fileB: string,
    startB: number,
  ): string {
    return [fileA, startA, fileB, startB].sort().join('|');
  }

  /**
   *
   * @param dir
   * @param extensions
   * @param ignorePatterns
   * @returns
   */
  private collectFiles(
    dir: string,
    extensions: string[],
    ignorePatterns: string[],
  ): string[] {
    const results: string[] = [];

    if (!fs.existsSync(dir)) {
      this.logger.warn(`Directory not found: ${dir}`);
      return results;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (ignorePatterns.some((pattern) => fullPath.includes(pattern))) {
        continue;
      }

      if (entry.isDirectory()) {
        results.push(
          ...this.collectFiles(fullPath, extensions, ignorePatterns),
        );
      } else if (extensions.includes(path.extname(entry.name))) {
        results.push(fullPath);
      }
    }

    return results;
  }
}
