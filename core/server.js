var cjson       = require('cjson');
var _           = require('lodash');
var fs          = require('fs');
var glob        = require('glob');

var http        = require('http');

var express     = require('express');
var router      = express.Router();

var bodyParser  = require('body-parser');
var mOverride   = require('method-override');
var cors        = require('cors');
var compression = require('compression');

//Mongo
var restful     = require('node-restful');
var mongoose    = restful.mongoose;
var acl         = require('mongoose-acl');

//Auth
var jwt         = require('express-jwt');

//Logging
var morgan      = require('morgan');

//REPL
var replify     = require('replify');

module.exports = function(config_file) {
  var config = cjson.load(config_file);
  var app = express();

  var options = { server: { socketOptions: { keepAlive: 1 } } };
  mongoose.connect(config.mongoString + config.dbname, options);

  var logger = require('./logger.js')(config);
  app.use(morgan(config.logFormat, {stream: logger.stream}));


  //app.use(compression({threshold: config.compressionThreshold}));
  app.use(cors());
  app.use(bodyParser.json());
  app.use(mOverride());
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json(err);
  });

  require('./auth.js')(app, config);
  app.use('/api', jwt({ secret: config.webTokenSecret}));

  app.get('/api/api', function(req,res) {
    res.json({
      version: "0.3.2",
      user: req.user
    });
  });

  var Resource = restful.model('resource', mongoose.Schema({
      title: 'string',
      year: 'number'
    })).methods(['get', 'post', 'put', 'delete']);

  Resource.register(app, 'resources');

  app.listen(config.http);
  logger.info('HTTP server listening on port: ' + config.http);

  var context = {};
  if (config.replTerminal) {
    replify(config.replTerminal, app, context);
    logger.info('REPL terminal activated, access it with rc /tmp/repl/'+ config.replTerminal + '.sock');
  }

  require('blocked')(function(ms){
    logger.info('BLOCKED FOR %sms', ms | 0);
  });
}
