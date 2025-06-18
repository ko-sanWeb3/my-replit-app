import { createServer } from "http";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Complete authentication bypass at HTTP level
console.log('Starting server with NO AUTHENTICATION');

// Clear all auth environment variables
Object.keys(process.env).forEach(key => {
  if (key.includes('AUTH') || key.includes('REPL') || key.includes('OAUTH') || 
      key.includes('SESSION') || key.includes('TOKEN')) {
    delete process.env[key];
  }
});

// Force guest mode
process.env.DISABLE_REPLIT_AUTH = 'true';
process.env.NO_AUTH = 'true';

// Universal authentication blocker - runs first
app.use((req: any, res: any, next: any) => {
  // Block all auth requests at the entry point
  const url = req.url || req.originalUrl || '';
  
  if (url.includes('auth') || url.includes('login') || url.includes('oauth') || url.includes('callback')) {
    console.log(`BLOCKED: ${req.method} ${url}`);
    
    // Force redirect to home with immediate HTML response
    res.writeHead(302, {
      'Location': '/',
      'Cache-Control': 'no-cache'
    });
    return res.end();
  }
  
  // Remove all auth data
  delete req.user;
  delete req.session;
  req.isAuthenticated = () => false;
  
  // Clear auth headers
  if (req.headers) {
    delete req.headers.authorization;
    delete req.headers.cookie;
    Object.keys(req.headers).forEach(key => {
      if (key.toLowerCase().includes('auth') || key.toLowerCase().includes('replit')) {
        delete req.headers[key];
      }
    });
  }
  
  next();
});

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
