module.exports = {
  apps: [
    {
      name: 'cemetery-registry',
      script: 'server.js',
      instances: 1, // SQLite (single-writer) - keep this at 1 unless you migrate to a networked DB
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '400M',
      autorestart: true,
      watch: false,
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      time: true,
    },
  ],
};
