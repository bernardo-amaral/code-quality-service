import { Module } from '@nestjs/common';
import { AnalyzeModule } from './analyze/analyze.module';

@Module({
  imports: [AnalyzeModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
