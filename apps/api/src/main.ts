import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: (configService.get<string>("CORS_ORIGINS") ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Salud Digital Interoperable API")
    .setDescription(
      "FHIR-lite API with JWT authentication for web clients and double API key authentication for integrations."
    )
    .setVersion("1.0.0")
    .addBearerAuth()
    .addApiKey(
      { type: "apiKey", name: "X-Access-Key", in: "header" },
      "access-key"
    )
    .addApiKey(
      { type: "apiKey", name: "X-Permission-Key", in: "header" },
      "permission-key"
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  const port = Number(configService.get<string>("PORT") ?? 4000);
  await app.listen(port);
}

void bootstrap();
