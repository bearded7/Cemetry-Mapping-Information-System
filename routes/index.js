const authRoutes = require('./auth');
const apiRoutes = require('./api');
const viewsRoutes = require('./views');
const profileRoutes = require('./profile');
const adminRoutes = require('./admin');
const cemeteryRoutes = require('./cemeteries');
const graveRoutes = require('./graves');
const messageRoutes = require('./messages');

module.exports = {
  authRoutes,
  apiRoutes,
  viewsRoutes,
  profileRoutes,
  adminRoutes,
  cemeteryRoutes,
  graveRoutes,
  messageRoutes,
  registerRoutes: (app) => {
    app.use('/', viewsRoutes);
    app.use('/auth', authRoutes);
    app.use('/api', apiRoutes);
    app.use('/profile', profileRoutes);
    app.use('/admin', adminRoutes);
    app.use('/cemeteries', cemeteryRoutes);
    app.use('/graves', graveRoutes);
    app.use('/messages', messageRoutes);
  }
};
