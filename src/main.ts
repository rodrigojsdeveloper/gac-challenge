import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Organizational Units API')
    .setDescription(
      'User and organizational unit management API (Closing Table)',
    )
    .setVersion('1.0')
    .addTag('users', 'User creation and association operations')
    .addTag('groups', 'Group creation and management operations')
    .addTag('nodes', 'Hierarchy queries (ancestors and descendants)')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
