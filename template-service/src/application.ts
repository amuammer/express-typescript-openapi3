import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as cors from "cors";
import * as express from "express";
import * as multer from "multer";
import { resolve } from "path";
import { initSwaggerMiddlware } from "./middlewares/swagger";
import * as env from "./env";
import { inOutLogger } from "./log";
import * as cls from "./lib/cls";
import { getCorsOptions } from "./cors";
import * as helmet from "helmet";
import { Container } from "inversify";

export const initApp = (container: Container): express.Express => {
  env.checkEnv();
  env.set("DIContainer", container);
  const app = express();
  app.use(cls.setAllHeaders);
  app.use(bodyParser.json({
    limit: "5MB"
  }));
  app.use(compression());
  app.use(cors(getCorsOptions()));
  app.use(inOutLogger);
  app.use(helmet());
  const upload = multer();
  app.use(upload.any());

  initSwaggerMiddlware(app, resolve(__dirname), () => {
    // self.express.use('/api/weather', helloRouteBuilder);
    // Custom error handler that returns JSON
    app.use(function (err, req: express.Request, res: express.Response, next) {
      if (err) {
        const errStr = err.message || err.toString();
        const errMsg = { message: errStr, extra: err };
        if (res.statusCode < 400) {
          res.status(500);
        }
        res.json(errMsg);
      }
    });
  });

  return app;
};
