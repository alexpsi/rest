
    server  = require('../server.js'),
    seed    = require('./seeds/seed.js'),
    request = require('../node_modules/request/index.js'),
    async   = require('async'),
          _ = require('underscore');
    util    = require('util');
var app;
var usertable;
var mongoose = require('mongoose');
var lorel    = require('lorem-ipsum');
var docs;

describe("Init", function(done) {
  beforeEach(function(done) {
      app = server();
      mongoose.connection.once('open', done);
  });
  it('should start', function(done) {
    expect(true).to.equal(true);
    usertable = seed.createHundredUsers(function() {done();});
  });
});

describe("After the fixture has loaded", function() {
  it("there should be a hundred test users,", function (done) {
    seed.countUsers(function(count) {
      expect(count).to.equal(100);
      done();
    });
  });
  it("and we should be able to login with each of them", function(done) {
    expect(usertable.length).to.equal(100);
    var orders = [];
    _.map(usertable, function(user, index) {
      orders.push(function(cb) {
        request.post('http://localhost:8080/user/session/', { form: {
            username: user.username,
            password: user.password
          }
        }, function (error, response, body) {
            var token = JSON.parse(body).token;
            expect(response.statusCode).to.equal(200);
            expect(token).toBeDefined;
            usertable[index].token = token;
            cb();
        });
      });
    });
    async.parallel(orders, done);
  });
  it("and collect a hundred authentication tokens", function(done) {
      expect(_.compact(_.pluck(usertable, 'token')).length).to.equal(100);
      done();
  });
});

describe("Authentication should fail when using", function() {
  it("a non existing user", function(done) {
    request.post('http://localhost:8080/user/session/', { form: {
        username: 'nonexistant',
        password: 'abcd'
      }
    }, function (error, response, body) {
        expect(response.statusCode).to.equal(401);
        done();
    });
  });
  it("a wrong password", function(done) {
    request.post('http://localhost:8080/user/session/', { form: {
        username: 'user50',
        password: 'dcba'
      }
    }, function (error, response, body) {
        expect(response.statusCode).to.equal(401);
        done();
    });
  });
})

describe("The scheme should dissallow", function() {
  it("duplicate usernames", function(done) {
    seed.createUser({
        name: 'user232',
    username: 'user40',
    password: 'abcd',
       email: 'user232@gmail.com'
    }, function(err,data) {
      seed.countUsers(function(count) {
        expect(count).to.equal(100);
        done();
      });
    });
  });
  it("duplicate emails", function(done) {
    seed.createUser({
        name: 'user232',
    username: 'user232',
    password: 'abcd',
      email:  'user40@gmail.com'
    }, function(err,data) {
      seed.countUsers(function(count) {
        expect(count).to.equal(100);
        done();
       email: 'user40@gmail.com'
      });
    });
  });
  it("empty passwords", function(done) {
    seed.createUser({
        name: 'user232',
    username: 'user232',
    password: '',
      email:  'user490@gmail.com'
    }, function(err,data) {
      seed.countUsers(function(count) {
        expect(count).to.equal(100);
        done();
       email: 'user40@gmail.com'
      });
    });
  });
})



describe("Each user", function() {
  it('can have multiple roles', function(done) {
    var User = seed.userModel();
    var orders = [];
    orders.push(function(cb) {User.addRole('user1', 'roleA', cb);});
    orders.push(function(cb) {User.addRole('user1', 'roleB', cb);});
    orders.push(function(cb) {User.addRole('user1', 'roleC', cb);});
    async.parallel(orders, function() {
      User.findOne({username: 'user1'}, function(err,user) {
          expect(user.roles.length).to.equal(3);
          done();
      })
    });
  });
  it('that can be removed', function(done) {
    var User = seed.userModel();
    var orders = [];
    orders.push(function(cb) {User.removeRole('user1', 'roleA', cb);});
    orders.push(function(cb) {User.removeRole('user1', 'roleB', cb);});
    async.parallel(orders, function() {
      User.findOne({username: 'user1'}, function(err,user) {
          expect(user.roles.length).to.equal(1);
          done();
      })
    });
  });
});

describe("When trying to access a path over /api ", function() {
  it('we should be able to access with all hundred users', function(done) {
    var orders = [];
    _.map(usertable, function(user, index) {
      orders.push(function(cb) {
        request.get('http://localhost:8080/api/api', {
          'auth': {
            'bearer': user.token
          }
        },
        function (error, response, body) {
          expect(response.statusCode).to.equal(200);
          expect(user.username).to.equal(JSON.parse(body).user.username);
          cb();
        });
      });
    });
    async.parallel(orders, done);
  })

  /*it('we should not be able to access it without a correct token', function(done) {
    request.get('http://localhost:8080/api/api', {
      'auth': {
        'bearer': 'badtoken'
      }
    },
    function (error, response, body) {
      expect(response.statusCode).to.equal(401);
      done();
    });
  });*/
})

describe('A logged in user', function() {
  it('can create resources', function(done) {
    var orders = [];
    _.map(_.range(1,101), function(datum) {
      orders.push(function(cb) {
        request.post('http://localhost:8080/api/v1/resources', {
          'auth': {
            'bearer':  usertable[0].token
          },
          'body': {
            title: "test" + datum,
            body: lorel({count: 2, units: 'paragraphs'})
          },
          json: true
        },
        function (error, response, body) {
          expect(response.statusCode).to.equal(201);
          cb();
        });
      });
    });
    async.parallel(orders, function() {
      mongoose.model('resource').find({owner: 'user1'}).count(function(err,count) {
        expect(count).to.equal(100);
        done();
      })
    });
  });

  it('can retrieve owned resources', function(done) {
    mongoose.model('resource').find({owner: 'user1'}, function(err, docs1) {
      docs = docs1;
      expect(docs.length).to.equal(100);
      done();
    });
  });

});

describe('A logged in user', function() {
  it('can update owned resources', function(done) {
    request({
      url: util.format('http://localhost:8080/api/v1/resources/%s', docs[0]._id),
      method: 'PUT',
      auth: {
        'bearer':  usertable[0].token
      },
      json: { title: "updated test"}
    },
    function(err, response, body) {
      expect(response.statusCode).to.equal(200);
      done();
    });
  });
  it('cannot update non-owned resources', function(done) {
    request({
      url: util.format('http://localhost:8080/api/v1/resources/%s', docs[0]._id),
      method: 'PUT',
      auth: {
        'bearer':  usertable[1].token
      },
      json: { title: "updated test"}
    },
    function(err, response, body) {
      expect(response.statusCode).to.equal(401);
      done();
    });

  });
});
