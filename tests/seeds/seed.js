var mongoose    = require('mongoose');
var async       = require('async');
var _           = require('lodash');


exports.createHundredUsers = function(callback) {
  var User  =  mongoose.model('User');

  var orders = [];
  orders.push(function(cb) {
    mongoose.connection.collections['users'].drop( function(err) {
      cb();
    });
  });
  //orders.push(function(cb) {
  //  mongoose.connection.collections['resources'].drop( function(err) {
  //    cb();
  //  });
  //});
  var userTable = [];
  _.map(_.range(1,101), function(index) {
    var tmodel = {
          name: 'user ' + index,
      username: 'user'  + index,
      password: 'abcd',
         email: 'user' + index + '@gmail.com'
    };
    userTable.push(tmodel);
    orders.push(function(cb) {
      var tuser = new User(tmodel);
      tuser.save(function(err,data) {cb(data);});
    });
  })
  async.parallel(orders, callback);
  return userTable;
}

exports.createUser = function(user,cb) {
  var User  =  mongoose.model('User');
  var tuser = new User(user);
  tuser.save(function(err,data) {
    cb(err,data);
  });
}

exports.countUsers = function(callback) {
  mongoose.model('User').count({}, function(err, count) { callback(count);});
}

exports.userModel = function() {return mongoose.model('User');}


/*
var Res   =  mongoose.model('resources');


var usr2  =  new User({name: 'user 2', username: 'user2', password: 'abcd', email: 'user2@gmail.com' });
var usr3  =  new User({name: 'user 3', username: 'user3', password: 'abcd', email: 'user3@gmail.com' });
var usr4  =  new User({name: 'user 4', username: 'user4', password: 'abcd', email: 'user4@gmail.com' });

var res1  =  new Res({title: 'res1', year: 2001});
var res2  =  new Res({title: 'res2', year: 2002});
var res3  =  new Res({title: 'res3', year: 2003});
var res4  =  new Res({title: 'res4', year: 2004});



usr1.setAccess(res1, ['read', 'write', 'delete']);
usr1.setAccess(res2, ['read', 'write', 'delete']);
usr1.setAccess(res3, ['read', 'write', 'delete']);

usr2.setAccess(res2, ['read', 'write', 'delete']);
usr2.setAccess(res3, ['read', 'write', 'delete']);
usr2.setAccess(res4, ['read', 'write', 'delete']);

usr3.setAccess(res3, ['read', 'write', 'delete']);
usr3.setAccess(res4, ['read', 'write', 'delete']);
usr3.setAccess(res1, ['read', 'write', 'delete']);

usr4.setAccess(res4, ['read', 'write', 'delete']);
usr4.setAccess(res1, ['read', 'write', 'delete']);
usr4.setAccess(res2, ['read', 'write', 'delete']);

usr1.save();
usr2.save();
usr3.save();
usr4.save();

res1.save();
res2.save();
res3.save();
res4.save();*/
