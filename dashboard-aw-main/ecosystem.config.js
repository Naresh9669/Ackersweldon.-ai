module.exports = {
  apps: [
    {
      name: 'dashboard-aw',
      script: 'npm',
      args: 'start',
      cwd: '/home/ubuntu/aw/dashboard-aw-main',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Error handling following Node.js best practices
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      
      // Process management
      min_uptime: '10s',
      max_restarts: 10,
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Signal handling for graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Memory management
      node_args: '--max-old-space-size=1024',
      
      // Restart conditions
      restart_delay: 4000,
      exp_backoff_restart_delay: 100
    }
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: '127.0.0.1',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/dashboard-aw.git',
      path: '/home/ubuntu/aw/dashboard-aw-main',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --production && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
