import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from './../src/app.setup';
import { AppModule } from './../src/app.module';

interface RunResponseBody {
  diagnostics: {
    actualRunnerMode: 'mock' | 'shopify';
    benchmarkEnabled: boolean;
    requestedRunnerMode: 'mock' | 'shopify';
  };
  errorDetails: Array<{
    code: string;
    message: string;
    source: string;
  }>;
  success: boolean;
  errors: string[];
  output: Record<string, unknown>;
  timings: {
    executionMs: number;
    parseMs: number;
    totalMs: number;
  };
}

describe('RunController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('/run (POST)', () => {
    return request(app.getHttpServer())
      .post('/run')
      .field(
        'inputJson',
        JSON.stringify({
          cart: {
            lines: [{ id: 'gid://shopify/CartLine/1' }],
          },
        }),
      )
      .field('functionType', 'product-discount')
      .attach('wasm', Buffer.from('wasm'), 'function.wasm')
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as RunResponseBody;

        expect(responseBody.success).toBe(true);
        expect(responseBody.errors).toEqual([]);
        expect(responseBody.errorDetails).toEqual([]);
        expect(responseBody.diagnostics).toMatchObject({
          actualRunnerMode: 'mock',
          benchmarkEnabled: false,
          requestedRunnerMode: 'mock',
        });
        expect(responseBody.output).toMatchObject({
          mockRunner: true,
          functionType: 'product-discount',
        });
      });
  });

  it('/run (POST) supports benchmark mode on the same endpoint', () => {
    return request(app.getHttpServer())
      .post('/run')
      .field('inputJson', JSON.stringify({ cart: { lines: [] } }))
      .field('functionType', 'cart-transform')
      .field('benchmarkIterations', '3')
      .field('benchmarkWarmup', '1')
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as RunResponseBody & {
          benchmark: {
            enabled: boolean;
            measuredRuns: number;
            warmupRuns: number;
          };
        };

        expect(responseBody.success).toBe(true);
        expect(responseBody.benchmark).toMatchObject({
          enabled: true,
          measuredRuns: 3,
          warmupRuns: 1,
        });
      });
  });

  it('/run (POST) rejects requests with missing inputJson', () => {
    return request(app.getHttpServer())
      .post('/run')
      .field('functionType', 'product-discount')
      .expect(400)
      .expect(({ body }) => {
        const errorBody = body as { message: string[] };

        expect(errorBody.message).toEqual(
          expect.arrayContaining([
            'inputJson must be longer than or equal to 1 characters',
          ]),
        );
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
