import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { version } from '../package.json';
import { printStartupBanner } from './common/startup-banner';

async function bootstrap() {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const port = process.env.PORT ?? 3000;

  const isDev = ['development', 'develop'].includes(nodeEnv);

  console.clear();

  printStartupBanner({
    appName: 'Batmanuel',
    version,
    environment: nodeEnv,
    port,
    swaggerUrl: isDev ? `http://localhost:${port}/docs` : undefined,
  });

  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      prefix: 'BATMANUEL',
      colors: true,
    }),
  });

  app.enableCors();

  if (isDev) {
    const config = new DocumentBuilder()
      .setTitle('Batmanuel API')
      .setDescription(
        'Code quality platform API. Analyzes repositories for code quality, ' +
          'security vulnerabilities, outdated/vulnerable dependencies and duplication.',
      )
      .setVersion('0.0.1')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        'access-token',
      )
      .addTag('auth', 'Token generation and authentication')
      .addTag('analyze', 'Code analysis and project reports')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    Logger.verbose('Swagger docs available at /docs');
  }

  await app.startAllMicroservices();
  await app.listen(port);

  Logger.verbose(`Application running on port ${port}`);
}
void bootstrap();
