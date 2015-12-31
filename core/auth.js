var mongoose     = require('mongoose');
var jsonwebtoken = require('jsonwebtoken');
require('./userModel.js');


module.exports = function(app, router, config) {
  router.post('/user/session', function(req, res) {
    var User = mongoose.model('User');
    User.findOne({
      username: req.body.username
    }, function(err, user) {
      if (err) throw err;
      if (!user) {
        return res.status(401).json({ success : false, message : 'authentication failed' });
      } else if (user) {
        // check if password matches
        if (!user.authenticate(req.body.password)) {
          return res.status(401).json({ success : false, message : 'authentication failed' });
        } else {
          // if user is found and password is right
          // create a token
          var token = jsonwebtoken.sign(user, config.webTokenSecret, {
            //expiresInMinutes: 1440 // expires in 24 hours
          });
          // return the information including token as JSON
          res.json({
            success: true,
            token: token,
            user: user
          });
        }
      }
    });
  });
  app.use(router);
}
