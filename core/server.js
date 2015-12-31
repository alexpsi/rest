var cjson       = require('cjson');
var config_file = process.argv[2] || 'config.json';
var config      = cjson.load(config_file);
var _           = require('lodash');
var fs          = require('fs');
var glob        = require('glob');

var http        = require('http');

var express     = require('express');
var router      = express.Router();
var restify     = require('express-restify-mongoose')
var bodyParser  = require('body-parser');
var mOverride   = require('method-override');
var cors        = require('cors');
var compression = require('compression');

//Mongo
var mongoose    = require('mongoose');
var acl         = require('mongoose-acl');

//Auth
var jwt         = require('express-jwt');

//Logging
var morgan      = require('morgan');

//REPL
var replify     = require('replify');

module.exports = function() {
  var app = express();

  var logger = require('./logger.js');
  app.use(morgan(config.logFormat, {stream: logger.stream}));


  //app.use(compression({threshold: config.compressionThreshold}));
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(mOverride());
  app.use('/api', jwt({ secret: config.webTokenSecret}));


  // Connect to mongodb
  var connect = function () {
    var options = { server: { socketOptions: { keepAlive: 1 } } };
    mongoose.connect(config.mongoString + config.dbname, options);
  };
  connect();


  mongoose.connection.on('error', console.log);
  mongoose.connection.on('disconnected', connect);

  //Core modules

  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json(err);
  });


  var context = {};
  glob("modules/core/*/index.js",{}, function (er, files) {
    _.each(files, function(file) {
      require('../' + file)(app, router);
    });
  });

  router.get('/api/api', function(req,res) {
    res.json({
      version: "0.03",
      user: req.user
    });
  });


  var httpServer = http.createServer(app);
  httpServer.listen(config.http);
  logger.info('HTTP server listening on port: ' + config.http);


  if (config.replTerminal) {
    replify(config.replTerminal, app, context);
    logger.info('REPL terminal activated, access it with rc /tmp/repl/'+ config.replTerminal + '.sock');
  }

  require('blocked')(function(ms){
    logger.info('BLOCKED FOR %sms', ms | 0);
  });
}
