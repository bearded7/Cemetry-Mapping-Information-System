/**
 * Cemetery Mapping Information System - Routes Index
 * Aggregates and exports all route modules
 */

const fs = require('fs');
const path = require('path');

// Import all route modules
const authRoutes = require('./auth');
const apiRoutes = require('./api');
const viewsRoutes = require('./views');
const profileRoutes = require('./profile');
const adminRoutes = require('./admin');
const cemeteryRoutes = require('./cemeteries');
const graveRoutes = require('./graves');
const messageRoutes = require('./messages');

/**
 * Register all routes with the Express app
 * @param {Express} app - Express application instance
 */
const registerRoutes = (app) => {
  // Public routes
  app.use('/', viewsRoutes);
  app.use('/auth', authRoutes);
  
  // API routes (mixed public/private)
  app.use('/api', apiRoutes);
  
  // Protected routes (authentication required)
  app.use('/profile', profileRoutes);
  app.use('/admin', adminRoutes);
  app.use('/cemeteries', cemeteryRoutes);
  app.use('/graves', graveRoutes);
  app.use('/messages', messageRoutes);
  
  // Health check endpoint (public)
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      node: process.version
    });
  });
  
  // 404 handler (catch-all for unmatched routes)
  app.use((req, res) => {
    res.status(404).render('error', {
      title: '404 - Page Not Found',
      message: 'The page you are looking for does not exist.',
      error: {},
      user: req.session.user || null,
      isAuthenticated: !!req.session.user
    });
  });
  
  // Error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    const status = err.status || 500;
    const message = err.message || 'Internal server error';
    
    if (req.xhr || req.path.startsWith('/api')) {
      return res.status(status).json({
        success: false,
        error: message
      });
    }
    
    res.status(status).render('error', {
      title: 'Error',
      message: message,
      error: process.env.NODE_ENV === 'development' ? err : {},
      user: req.session.user || null,
      isAuthenticated: !!req.session.user
    });
  });
};

/**
 * Get list of all registered routes with their methods
 * @param {Express} app - Express application instance
 * @returns {Array} Array of route objects
 */
const getRouteList = (app) => {
  const routes = [];
  
  // Helper to extract routes from the app's router stack
  const extractRoutes = (layer, basePath = '') => {
    if (layer.route) {
      // This is a route layer
      const path = basePath + (layer.route.path || '');
      const methods = Object.keys(layer.route.methods)
        .filter(method => layer.route.methods[method])
        .map(method => method.toUpperCase());
      
      routes.push({
        path: path || '/',
        methods: methods,
        middleware: layer.route.stack.length || 0
      });
    } else if (layer.name === 'router' || layer.name === 'bound dispatch') {
      // This is a router layer
      const routerPath = layer.regexp.source
        .replace(/\\\//g, '/')
        .replace(/\^/g, '')
        .replace(/\?/g, '')
        .replace(/\(\?:\(\(\?:\.\*\)\)\)/g, '')
        .replace(/\\/g, '');
      
      const router = layer.handle;
      if (router && router.stack) {
        router.stack.forEach(subLayer => {
          extractRoutes(subLayer, basePath + (routerPath || ''));
        });
      }
    }
  };
  
  // Extract routes from app's router stack
  if (app._router && app._router.stack) {
    app._router.stack.forEach(layer => {
      extractRoutes(layer);
    });
  }
  
  return routes;
};

// Export route modules for direct access if needed
module.exports = {
  registerRoutes,
  getRouteList,
  authRoutes,
  apiRoutes,
  viewsRoutes,
  profileRoutes,
  adminRoutes,
  cemeteryRoutes,
  graveRoutes,
  messageRoutes
};

// Also export for use in server.js
module.exports.default = registerRoutes;