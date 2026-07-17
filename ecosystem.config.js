module.exports = {
  apps: [
    {
      name: 'rapigo-mali',
      script: '.next/standalone/server.js',
      cwd: '/home/rapigo',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'file:/home/rapigo/data/rapigo.db',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/home/rapigo/logs/error.log',
      out_file: '/home/rapigo/logs/out.log',
      merge_logs: true,
      max_memory_restart: '512M',
    },
  ],
};