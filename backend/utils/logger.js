const winston = require('winston');
const { Client } = require('@opensearch-project/opensearch');

// Configuración de logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'hoodfy-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console logging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Agregar OpenSearch transport si está configurado
if (process.env.OPENSEARCH_URL) {
  // Crear transport personalizado para OpenSearch usando winston.transports.Console
  class OpenSearchTransport extends winston.transports.Console {
    constructor(options) {
      super(options);
      this.name = 'opensearch';
    }

    async log(info, callback) {
      try {
        if (process.env.OPENSEARCH_URL) {
          const client = new Client({
            node: process.env.OPENSEARCH_URL,
            auth: {
              username: process.env.OPENSEARCH_USERNAME || 'hoodfy_admin',
              password: process.env.OPENSEARCH_PASSWORD
            },
            ssl: { rejectUnauthorized: false }
          });

          const logData = {
            timestamp: new Date().toISOString(),
            level: info.level,
            message: info.message,
            service: info.service || 'hoodfy-backend',
            environment: info.environment || 'development',
            userId: info.userId || 'system',
            requestId: info.requestId,
            path: info.path,
            method: info.method,
            statusCode: info.statusCode,
            responseTime: info.responseTime,
            ...info
          };

          await client.index({
            index: `hoodfy-logs-${new Date().toISOString().split('T')[0]}`,
            body: logData
          });
        }
      } catch (error) {
        console.error('Error sending log to OpenSearch:', error);
      }
      
      callback();
    }
  }

  logger.add(new OpenSearchTransport({
    level: 'info'
  }));
}

// Middleware para logging de requests
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || generateRequestId();
  
  req.requestId = requestId;
  req.startTime = startTime;

  // Log request
  logger.info('HTTP Request', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    userId: req.userId || 'anonymous',
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('HTTP Response', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: duration,
      userId: req.userId || 'anonymous',
      timestamp: new Date().toISOString()
    });
  });

  next();
};

// Función para generar request ID
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Funciones de logging específicas
const logError = (error, context = {}) => {
  logger.error('Application Error', {
    error: error.message,
    stack: error.stack,
    ...context
  });
};

const logPerformance = (operation, duration, context = {}) => {
  logger.info('Performance Metric', {
    operation,
    duration,
    ...context
  });
};

const logSecurity = (event, context = {}) => {
  logger.warn('Security Event', {
    event,
    ...context
  });
};

const logBusiness = (event, data, context = {}) => {
  logger.info('Business Event', {
    event,
    data,
    ...context
  });
};

module.exports = {
  logger,
  requestLogger,
  logError,
  logPerformance,
  logSecurity,
  logBusiness
};
