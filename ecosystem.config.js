
module.exports = {
  apps: [
    {
      name: 'guess-my-word',
      script: './build/server.js',
      out_file: './logs/app.log',
      error_file: './logs/app-errors.log',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git', '.data'],
      instances: '1',
      exec_mode: 'cluster',
      max_memory_restart: '1000M',
      merge_logs: true,
    },
  ],
};

