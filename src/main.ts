import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Organizational Units API')
    .setDescription(
      'User and organizational unit management API (Closing Table)',
    )
    .setVersion('1.0')
    .addTag('Users', 'User creation and association operations')
    .addTag('Groups', 'Group creation and management operations')
    .addTag('Nodes', 'Hierarchy queries (ancestors and descendants)')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.useGlobalPipes(new ValidationPipe());
  app.useLogger(app.get(Logger));

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
