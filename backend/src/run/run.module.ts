import { Module } from '@nestjs/common';
import { MockFunctionRunnerService } from './mock-function-runner.service';
import { RunController } from './run.controller';
import { RunRequestParserService } from './run-request-parser.service';
import { RunService } from './run.service';
import { ShopifyFunctionRunnerService } from './shopify-function-runner.service';

@Module({
  controllers: [RunController],
  providers: [
    MockFunctionRunnerService,
    RunRequestParserService,
    RunService,
    ShopifyFunctionRunnerService,
  ],
})
export class RunModule {}
