import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((item) => item.trim()).filter(Boolean)
    : true;
  app.enableCors({
    origin: corsOrigin,
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: errors.map((error) => ({
            field: error.property,
            errors: Object.values(error.constraints ?? {})
          }))
        })
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Storage Helper API")
    .setDescription("Storage Helper V1 API documentation")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
