'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');

const { PORT, API_PREFIX, cors: corsCfg, NODE_ENV } = require('./config/env');
const { connectDB } = require('./config/database');
const { verifyMailer } = require('./config/mailer');
const { accessLogStream, morganFormat, logger } = require('./utils/logger.util');
const { startScheduler } = require('./jobs/scheduler');
const { apiLimiter } = require('./middlewares/rateLimiter.middleware');
const { notFound, errorHandler } = require('./middlewares/errorHandler.middleware');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: corsCfg.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

app.use(
  morgan(morganFormat, {
    stream: NODE_ENV === 'production' ? accessLogStream : process.stdout,
  })
);

app.use('/uploads', express.static('uploads'));
app.use(API_PREFIX, apiLimiter);

app.get(`${API_PREFIX}/health`, (_req, res) => {
  res.json({ success: true, message: 'API operationnelle', env: NODE_ENV });
});

app.get(`${API_PREFIX}`, (_req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur l API Clinique',
    docs: `${API_PREFIX}/endpoints`,
  });
});

app.get(`${API_PREFIX}/endpoints`, (_req, res) => {
  res.json({
    success: true,
    endpoints: {
      auth: ['/auth/login', '/auth/register', '/auth/refresh', '/auth/me'],
      users: ['/utilisateurs', '/users'],
      doctors: ['/medecins', '/doctors'],
      patients: ['/patients', '/clients'],
      appointments: ['/rendez-vous', '/appointments'],
      availability: ['/disponibilites', '/availability'],
      clinic: ['/clinique', '/clinic'],
      services: ['/services'],
      notifications: ['/notifications'],
      logs: ['/audit-logs', '/logs'],
      jobs: ['/system-jobs', '/jobs'],
    },
  });
});

const routes = require('./routes/index');
app.use(API_PREFIX, routes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();
  await verifyMailer();
  startScheduler();
  app.listen(PORT, () => {
    logger.info(`Serveur demarre sur http://localhost:${PORT}${API_PREFIX}`);
    logger.info(`Environnement : ${NODE_ENV}`);
  });
}

if (NODE_ENV !== 'test') {
  start();
}

module.exports = app;