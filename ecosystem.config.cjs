/**
 * This is the configuration file for pm2 to start the production server
 */
module.exports = {
    apps: [
        {
            name: 'mcps-monday-archive',
            exec_mode: 'cluster',
            instances: '1',
            script: './.output/server/index.mjs',
        },
    ],
}