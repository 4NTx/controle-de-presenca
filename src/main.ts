import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as morgan from 'morgan';
import helmet from 'helmet';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.use(helmet());
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    preflightContinue: false,
    allowedHeaders:
      'Authorization, Origin, X-Requested-With, Content-Type, Accept, Recaptcha',
    credentials: true,
  });

  app.use(morgan('combined'));

  const PORT = 3000;
  await app.listen(PORT);
  console.log(
    `😈 A Aplicação está rodando na porta \x1b[1m\x1b[35m${PORT}\x1b[0m`,
  );
}
bootstrap();
