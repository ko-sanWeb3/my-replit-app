// Complete application bootstrap without any authentication
import express from "express";

// Create app instance
export const app = express();

// CRITICAL: Override Express's built-in authentication handling
(app as any).use = function(path: any, ...handlers: any[]) {
  // If path is actually a handler function
  if (typeof path === 'function') {
    handlers.unshift(path);
    path = '/';
  }
  
  // Filter out any authentication middleware
  const filteredHandlers = handlers.filter(handler => {
    if (typeof handler === 'function') {
      const handlerStr = handler.toString();
      // Block any middleware that looks like authentication
      if (handlerStr.includes('passport') || 
          handlerStr.includes('session') ||
          handlerStr.includes('auth') ||
          handlerStr.includes('login') ||
          handlerStr.includes('isAuthenticated')) {
        console.log('BLOCKED AUTH MIDDLEWARE:', handlerStr.substring(0, 100));
        return false;
      }
    }
    return true;
  });
  
  // Call original use method with filtered handlers
  return express.application.use.call(this, path, ...filteredHandlers);
};

// Override router creation to prevent auth routes
const originalRouter = express.Router;
express.Router = function(options?: any) {
  const router = originalRouter(options);
  
  // Override router methods to block auth routes
  const methods = ['get', 'post', 'put', 'delete', 'patch', 'all'];
  methods.forEach(method => {
    const originalMethod = router[method];
    router[method] = function(path: string, ...handlers: any[]) {
      if (path.includes('auth') || path.includes('login') || path.includes('callback')) {
        console.log(`BLOCKED AUTH ROUTE: ${method.toUpperCase()} ${path}`);
        // Replace with guest-friendly handler
        return originalMethod.call(this, path, (req: any, res: any) => {
          res.redirect('/');
        });
      }
      return originalMethod.call(this, path, ...handlers);
    };
  });
  
  return router;
};

console.log('App created with authentication completely disabled');