// Nuclear option: Completely eliminate all authentication
import type { Express } from "express";

export function killAuthentication(app: Express) {
  // Intercept ALL requests before any other middleware
  app.use((req: any, res: any, next: any) => {
    // Remove ALL authentication-related data
    req.headers = req.headers || {};
    
    // Clear all auth headers
    Object.keys(req.headers).forEach(key => {
      if (key.toLowerCase().includes('auth') || 
          key.toLowerCase().includes('replit') ||
          key.toLowerCase().includes('session') ||
          key.toLowerCase().includes('cookie')) {
        delete req.headers[key];
      }
    });
    
    // Force guest mode
    req.isAuthenticated = () => false;
    req.user = null;
    req.session = null;
    
    // Override redirect to prevent auth redirects
    const originalRedirect = res.redirect;
    res.redirect = function(location: string) {
      console.log('Intercepted redirect to:', location);
      if (location.includes('auth') || location.includes('login') || location.includes('oauth')) {
        console.log('Blocked auth redirect, sending home page');
        this.writeHead(200, { 'Content-Type': 'text/html' });
        return this.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>FridgeKeeper</title>
            <meta http-equiv="refresh" content="0; url=/">
          </head>
          <body>
            <script>
              window.location.replace('/');
            </script>
          </body>
          </html>
        `);
      }
      return originalRedirect.call(this, location);
    };
    
    next();
  });
  
  // Block auth endpoints completely
  app.all('/api/login*', (req, res) => {
    console.log('Blocked login endpoint');
    res.redirect('/');
  });
  
  app.all('/api/logout*', (req, res) => {
    console.log('Blocked logout endpoint');
    res.redirect('/');
  });
  
  app.all('/api/callback*', (req, res) => {
    console.log('Blocked callback endpoint');
    res.redirect('/');
  });
  
  app.all('/api/auth*', (req, res) => {
    console.log('Blocked auth API endpoint');
    res.json({ error: 'Authentication disabled', guest: true });
  });
  
  app.all('/auth*', (req, res) => {
    console.log('Blocked general auth endpoint');
    res.redirect('/');
  });
}