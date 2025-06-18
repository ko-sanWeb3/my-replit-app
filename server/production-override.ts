// Production-specific authentication override
import type { Express } from "express";

export function overrideProductionAuth(app: Express) {
  // Override at the HTTP server level
  app.use((req: any, res: any, next: any) => {
    // Completely override any Replit authentication middleware
    const originalUrl = req.originalUrl || req.url;
    
    // If this is ANY auth-related request, kill it immediately
    if (originalUrl.includes('auth') || 
        originalUrl.includes('login') || 
        originalUrl.includes('oauth') ||
        originalUrl.includes('callback')) {
      
      console.log(`BLOCKED AUTH REQUEST: ${originalUrl}`);
      
      // Return a simple HTML page that redirects to home
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      return res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>FridgeKeeper</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h1>🍔 FridgeKeeper</h1>
            <p>ログイン不要でご利用いただけます</p>
            <p>Redirecting to app...</p>
          </div>
          <script>
            // Immediate redirect without any delay
            window.location.replace('/');
          </script>
        </body>
        </html>
      `);
    }
    
    // Force remove all authentication data
    delete req.user;
    delete req.session;
    req.isAuthenticated = () => false;
    
    // Clear auth headers completely
    if (req.headers) {
      delete req.headers.authorization;
      delete req.headers.cookie;
      Object.keys(req.headers).forEach(key => {
        if (key.toLowerCase().includes('auth') || 
            key.toLowerCase().includes('replit') ||
            key.toLowerCase().includes('session')) {
          delete req.headers[key];
        }
      });
    }
    
    next();
  });
  
  // Add explicit guest-only API responses
  app.get('/api/user', (req, res) => {
    res.json({ guest: true, authenticated: false });
  });
  
  app.get('/api/auth/user', (req, res) => {
    res.json({ guest: true, authenticated: false });
  });
  
  app.post('/api/auth/user', (req, res) => {
    res.json({ guest: true, authenticated: false });
  });
}