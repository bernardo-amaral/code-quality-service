import { Module } from '@nestjs/common';
import { DependencyScannerService } from './dependency-scanner.service';
import { DuplicationService } from './duplication.service';
import { SecurityService } from './security.service';

@Module({
  providers: [DuplicationService, SecurityService, DependencyScannerService],
  exports: [DuplicationService, SecurityService, DependencyScannerService],
})
export class EnginesModule {}
