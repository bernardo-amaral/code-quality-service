import { Module } from '@nestjs/common';
import { AnalyzeController } from './analyze.controller';
import { AnalyzeService } from './analyze.service';
import { AuthModule } from '../auth/auth.module';
import { EnginesModule } from '../engines/engines.module';
import { DuplicationService } from 'src/engines/duplication.service';

@Module({
  imports: [AuthModule, EnginesModule],
  controllers: [AnalyzeController],
  providers: [AnalyzeService, DuplicationService],
})
export class AnalyzeModule {}
