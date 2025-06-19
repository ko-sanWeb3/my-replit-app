import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createAuthBypass, clearAuthHeaders } from "./bypass-auth";
import { forcePublicDeployment } from "./force-public";

const app = express();

console.log('=== STARTING PUBLIC DEPLOYMENT SERVER ===');

// Force public deployment by removing auth dependencies
forcePublicDeployment();

// Force public deployment environment
process.env.DISABLE_REPLIT_AUTH = 'true';
process.env.NO_AUTH = 'true';
process.env.GUEST_ONLY = 'true';
process.env.PUBLIC_DEPLOYMENT = 'true';
process.env.REPLIT_DEPLOYMENT_TYPE = 'public';

// Remove authentication-related variables that force private deployment
delete process.env.SESSION_SECRET;
delete process.env.REPLIT_DB_URL;
delete process.env.AUTH_SECRET;
delete process.env.NEXTAUTH_SECRET;

// Apply authentication bypass layers
app.use(clearAuthHeaders());
app.use(createAuthBypass());

// Force production environment to guest mode
if (process.env.NODE_ENV === 'production') {
  console.log('PRODUCTION MODE: Forcing guest-only access');
  process.env.FORCE_GUEST_MODE = 'true';
}

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
