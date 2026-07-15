import { Module } from '@nestjs/common';
import { RulesService } from './rules.service';
import { RULES_CONFIG } from './rules.constants';
import { DEFAULT_RULES_CONFIG } from './config/default-rules.config';

@Module({
  providers: [
    RulesService,
    {
      provide: RULES_CONFIG,
      useValue: DEFAULT_RULES_CONFIG,
    },
  ],
  exports: [RulesService, RULES_CONFIG],
})
export class RulesModule {}
