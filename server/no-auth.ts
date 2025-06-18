// Complete authentication bypass for guest-only access
import type { Express, Request, Response, NextFunction } from "express";

export function disableAllAuthentication(app: Express) {
  // Override any potential authentication middleware
  app.use((req: any, res: Response, next: NextFunction) => {
    // Remove all Replit auth headers
    delete req.headers['x-replit-user-id'];
    delete req.headers['x-replit-user-name'];
    delete req.headers['x-replit-user-bio'];
    delete req.headers['x-replit-user-profile-image'];
    delete req.headers['x-replit-user-roles'];
    delete req.headers['x-replit-user-teams'];
    delete req.headers['x-replit-user-url'];
    delete req.headers['authorization'];
    
    // Ensure no authentication functions exist
    req.isAuthenticated = () => false;
    req.user = null;
    req.logout = () => {};
    
    next();
  });

  // Intercept all auth routes and redirect to home
  app.use('/api/login*', (req, res) => {
    console.log('Blocked login attempt, redirecting to home');
    res.redirect('/');
  });
  
  app.use('/api/logout*', (req, res) => {
    console.log('Blocked logout attempt, redirecting to home');
    res.redirect('/');
  });
  
  app.use('/api/callback*', (req, res) => {
    console.log('Blocked auth callback, redirecting to home');
    res.redirect('/');
  });
  
  app.use('/api/auth*', (req, res) => {
    console.log('Blocked auth API call, returning error');
    res.status(200).json({ message: "Authentication disabled - guest mode only" });
  });
}