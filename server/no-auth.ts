// Complete authentication bypass for guest-only access
import type { Express, Request, Response, NextFunction } from "express";

export function disableAllAuthentication(app: Express) {
  // First level: Block all authentication at the middleware level
  app.use((req: any, res: Response, next: NextFunction) => {
    // Kill all authentication-related headers completely
    const authHeaders = [
      'authorization', 'x-replit-user-id', 'x-replit-user-name', 
      'x-replit-user-bio', 'x-replit-user-profile-image', 
      'x-replit-user-roles', 'x-replit-user-teams', 'x-replit-user-url',
      'cookie', 'set-cookie', 'session'
    ];
    
    authHeaders.forEach(header => {
      delete req.headers[header];
      req.headers[header] = '';
    });
    
    // Override authentication functions completely
    req.isAuthenticated = () => false;
    req.user = null;
    req.logout = () => {};
    req.login = () => {};
    req.session = null;
    
    // Block any auth redirects at response level
    const originalRedirect = res.redirect;
    res.redirect = function(url: string) {
      if (url.includes('login') || url.includes('auth') || url.includes('oauth')) {
        console.log('Blocked auth redirect to:', url);
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
          <head><title>FridgeKeeper</title></head>
          <body>
            <script>window.location.href = '/';</script>
            <p>Redirecting to app...</p>
          </body>
          </html>
        `);
      }
      return originalRedirect.call(this, url);
    };
    
    next();
  });

  // Second level: Catch all auth routes before they can process
  const authRoutes = [
    '/api/login', '/api/logout', '/api/callback', '/api/auth',
    '/auth', '/login', '/logout', '/oauth', '/.well-known',
    '/api/auth/user', '/api/user'
  ];
  
  authRoutes.forEach(route => {
    app.use(route + '*', (req, res) => {
      console.log(`Blocked auth route: ${req.path}`);
      if (req.path.includes('/api/')) {
        return res.status(200).json({ 
          message: "Authentication disabled", 
          user: null,
          authenticated: false 
        });
      }
      // For non-API routes, redirect to home
      return res.redirect('/');
    });
  });

  // Third level: Override any potential Express session middleware
  app.use((req: any, res, next) => {
    // Completely disable session functionality
    if (req.session) {
      req.session = null;
    }
    if (req.sessionStore) {
      req.sessionStore = null;
    }
    next();
  });
}