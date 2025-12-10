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