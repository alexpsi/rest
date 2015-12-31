var winston     = require('winston');
var cjson       = require('cjson');
var config_file = process.argv[2] || 'config.json';
var config      = cjson.load(config_file);
var fs          = require('fs');

if (!fs.existsSync(config.log_dir)){
    fs.mkdirSync(config.log_dir);
}


winston.emitErrs = true;

var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: config.log_dir + '/error.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false
        }),
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: config.exitOnError

});


var access_logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: config.log_dir + '/access.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false
        }),
    ],
    exitOnError: config.exitOnError
});

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding){
        accces_logger.info(message);
    }
};

