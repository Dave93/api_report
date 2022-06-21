import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpResponseInterceptor, HttpExceptionFilter } from '@common/http';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { SwaggerConfig } from '@config';
import * as helmet from 'helmet';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(compression());

  var whitelist = ['https://report.hq.fungeek.net', 'http://localhost:3000'];
  app.enableCors({
    origin: function (origin, callback) {
      // if (whitelist.indexOf(origin) !== -1) {
      //   console.log("allowed cors for:", origin)
        callback(null, true)
      // } else {
      //   console.log("blocked cors for:", origin)
      //   callback(new Error('Not allowed by CORS'))
      // }
    },
    allowedHeaders: 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe, Authorization',
    methods: "GET,PUT,POST,DELETE,UPDATE,OPTIONS",
    credentials: true,
  });

  
  app.enableVersioning();

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new HttpResponseInterceptor());
  app.useGlobalPipes(new ValidationPipe());

  app.setGlobalPrefix(AppModule.apiPrefix);
  SwaggerConfig(app, AppModule.apiVersion);

  await app.listen(AppModule.port);
    const server = app.getHttpServer();
    const router = server._events.request._router;

    const availableRoutes: [] = router.stack
        .map(layer => {
            if (layer.route) {
                return {
                    route: {
                        path: layer.route?.path,
                        method: layer.route?.stack[0].method,
                    },
                };
            }
        })
        .filter(item => item !== undefined);
    console.log(availableRoutes);
  return AppModule.port;
};

bootstrap().then((port: number) => {
  Logger.log(`Application running on port: ${port}`, 'Main');
});
