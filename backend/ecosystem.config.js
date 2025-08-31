module.exports = {
  apps: [{
    name: 'hoodfy-backend',
    script: 'index.js',
    instances: 'max', // Usar todos los CPU cores disponibles
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 5000
    },
    
    // Configuración de monitoreo
    pmx: true,
    
    // Configuración de memoria
    max_memory_restart: '1G',
    
    // Configuración de logs
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Configuración de restart
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 8000,
    
    // Health checks
    health_check_grace_period: 3000,
    health_check_fatal_exceptions: true,
    
    // Configuración de clustering
    instance_var: 'INSTANCE_ID',
    
    // Configuración de watch (solo desarrollo)
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    
    // Configuración de source map
    source_map_support: true,
    
    // Configuración de merge logs
    merge_logs: true,
    
    // Configuración de cron jobs
    cron_restart: '0 2 * * *', // Restart diario a las 2 AM
    
    // Configuración de autorestart
    autorestart: true,
    
    // Configuración de exp_backoff_restart_delay
    exp_backoff_restart_delay: 100,
    
    // Configuración de max_restarts
    max_restarts: 10,
    
    // Configuración de min_uptime
    min_uptime: '10s',
    
    // Configuración de restart_delay
    restart_delay: 4000,
    
    // Configuración de kill_timeout
    kill_timeout: 5000,
    
    // Configuración de listen_timeout
    listen_timeout: 8000,
    
    // Configuración de health_check_grace_period
    health_check_grace_period: 3000,
    
    // Configuración de health_check_fatal_exceptions
    health_check_fatal_exceptions: true,
    
    // Configuración de instance_var
    instance_var: 'INSTANCE_ID',
    
    // Configuración de watch
    watch: false,
    
    // Configuración de ignore_watch
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    
    // Configuración de source_map_support
    source_map_support: true,
    
    // Configuración de merge_logs
    merge_logs: true,
    
    // Configuración de cron_restart
    cron_restart: '0 2 * * *',
    
    // Configuración de autorestart
    autorestart: true,
    
    // Configuración de exp_backoff_restart_delay
    exp_backoff_restart_delay: 100
  }],
  
  // Configuración de deploy
  deploy: {
    production: {
      user: 'ubuntu',
      host: process.env.DEPLOY_HOST || 'api.hoodfy.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/hoodfy.git',
      path: '/var/www/hoodfy',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    staging: {
      user: 'ubuntu',
      host: process.env.STAGING_HOST || 'staging.hoodfy.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/hoodfy.git',
      path: '/var/www/hoodfy-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': ''
    }
  }
};
