module.exports = {
    apps: [
        {
            name: "SAS Afiliation",
            script: "pnpm start",
            cwd: process.cwd(),
            error_file: "/root/.pm2/logs/SAS-Afiliation-error.log",
            out_file: "/root/.pm2/logs/SAS-Afiliation-out.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            merge_logs: true,
            autorestart: true,
            max_restarts: 10,
            min_uptime: "10s",
            env: {
                NODE_ENV: "production"
            }
        }
    ]
};
