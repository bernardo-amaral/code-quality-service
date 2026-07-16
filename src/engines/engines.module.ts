import { Module } from '@nestjs/common';
import { DependencyScannerService } from './dependency-scanner.service';

@Module({
  imports: [],
  controllers: [],
  providers: [DependencyScannerService],
})
export class EnginesModule {}
