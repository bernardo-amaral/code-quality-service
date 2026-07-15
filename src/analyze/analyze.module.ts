import { Module } from '@nestjs/common';
import { AnalyzeController } from './analyze.controller';
import { AnalyzeService } from './analyze.service';
import { AuthModule } from '../auth/auth.module';
import { EnginesModule } from '../engines/engines.module';
import { DuplicationService } from 'src/engines/duplication.service';
import { RulesService } from 'src/rules/rules.service';
import { RulesModule } from 'src/rules/rules.module';

@Module({
  imports: [AuthModule, EnginesModule, RulesModule],
  controllers: [AnalyzeController],
  providers: [AnalyzeService, DuplicationService, RulesService],
})
export class AnalyzeModule {}
