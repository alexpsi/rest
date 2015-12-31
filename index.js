var config_file = process.argv[2] || 'config.json';
require('./core/server.js')(config_file);
