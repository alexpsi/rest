var winston     = require('winston');
var fs          = require('fs');

module.exports = function(config) {

    if (!fs.existsSync(config.log_dir)){
        fs.mkdirSync(config.log_dir);
    }

    winston.emitErrs = true;

    var logger = new winston.Logger({
        transports: [
            new winston.transports.File({
                level: 'info',
                filename: config.log_dir + '/error.log',
//                handleExceptions: true,
                json: true,
                maxsize: 5242880, //5MB
                maxFiles: 5,
                colorize: false
            }),
            new winston.transports.Console({
                level: 'debug',
//                handleExceptions: true,
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
  //              handleExceptions: true,
                json: true,
                maxsize: 5242880, //5MB
                maxFiles: 5,
                colorize: false
            }),
        ],
        exitOnError: config.exitOnError
    });

    logger.stream = {
        write: function(message, encoding){
            access_logger.info(message);
        }
    };

    return logger;
}


