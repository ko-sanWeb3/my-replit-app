import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { killAuthentication } from "./auth-killer";

const app = express();

// NUCLEAR OPTION: Complete authentication elimination
console.log('=== DISABLING ALL AUTHENTICATION ===');

// Kill ALL possible authentication environment variables
Object.keys(process.env).forEach(key => {
  if (key.includes('AUTH') || key.includes('REPL') || key.includes('OAUTH') || 
      key.includes('SESSION') || key.includes('TOKEN')) {
    delete process.env[key];
  }
});

// Force guest mode environment
process.env.DISABLE_REPLIT_AUTH = 'true';
process.env.NO_AUTH = 'true';
process.env.GUEST_ONLY = 'true';

// Apply nuclear authentication bypass BEFORE any other middleware
killAuthentication(app);

// Override the app.listen method to ensure we're serving without auth
const originalListen = app.listen;
app.listen = function(...args: any[]) {
  console.log('Starting server in GUEST-ONLY mode - NO AUTHENTICATION');
  return originalListen.apply(this, args);
};

// Debug middleware to capture raw request data
app.use('/api/food-items', (req: any, res, next) => {
  console.log('=== Food Items Request Debug ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('Content-Length:', req.get('Content-Length'));
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
