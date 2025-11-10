/**
 * PM2 Ecosystem Configuration
 *
 * Start services with: pm2 start ecosystem.config.js
 * View logs: pm2 logs
 * Restart: pm2 restart all
 * Stop: pm2 stop all
 */

module.exports = {
  apps: [
    {
      name: 'repair-dashboard',
      script: 'npm',
      args: 'start',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/dashboard-error.log',
      out_file: './logs/dashboard-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'lightspeed-sync',
      script: './scripts/sync-lightspeed-customers.ts',
      interpreter: 'tsx',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/sync-error.log',
      out_file: './logs/sync-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
}
