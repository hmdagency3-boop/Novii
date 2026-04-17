import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import cors from "cors";
import serverless from "serverless-http";
import { registerRoutes } from "../../novii/server/routes";

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = [
      process.env.ADMIN_PANEL_URL,
      process.env.VITE_ADMIN_PANEL_URL,
    ].filter(Boolean);
    const isNetlify = origin.endsWith(".netlify.app") || origin.endsWith(".netlify.live");
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(origin);
    const isReplit = origin.includes(".replit.dev") || origin.includes(".repl.co");
    if (allowed.includes(origin) || isNetlify || isLocalhost || isReplit) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-user-token", "x-user-id", "Authorization"],
}));

app.use(compression());
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`);
  });
  next();
});

let handlerReady: ReturnType<typeof serverless> | null = null;

const setup = (async () => {
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
  });

  handlerReady = serverless(app);
})();

export const handler = async (event: any, context: any) => {
  await setup;
  return handlerReady!(event, context);
};
