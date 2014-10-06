'use strict';
var express = require('express'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  cookieSession = require('cookie-session'),
  expressSession = require('express-session'),
  logger = require('morgan'),
  methodOverride = require('method-override'),
  serveFavicon = require('serve-favicon'),
  serveStatic = require('serve-static'),
  passport = require('passport'),
  util = require('util'),
  path = require('path'),
  GitHubStrategy = require('passport-github').Strategy;

var app = express();

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

var Server = function(options) {
  this.start = this.start.bind(this);
  this.config = options;
};

Server.prototype.start = function(done) {
  var conf = this.config;
  var options = {
    clientID: conf.githubClientId,
    clientSecret: conf.githubClientSecret,
    callbackURL: conf.scheme + '://' + conf.hostname +  '/auth/github/callback'
  };
  var handler = function(accessToken, refreshToken, profile, done) {
    // TODO: Load the user record here.
    process.nextTick(function() {
      profile.token = accessToken;
      return done(null, profile);
    });
  };
  passport.use(new GitHubStrategy(options, handler));

  app.set('views', path.resolve(path.join(__dirname, '..', 'views')));
  app.set('view engine', 'ejs');
  app.use(logger('dev'));
  app.use(cookieParser());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  var options = {
    secret: conf.secret,
    resave: true,
    saveUninitialized: true
  };
  app.use(expressSession(options));
  app.use(passport.initialize());
  app.use(passport.session());
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(serveStatic(__dirname + '/public'));

  app.listen(conf.port, done);

  app.get('/', function(req, res) {
    if (req.user && req.user.token) {
      console.log(req.user.token);
    }
    res.render('index', { user: req.user });
  });

  app.get('/account', ensureAuthenticated, function(req, res) {
    res.render('account', { user: req.user });
  });

  app.get('/login', function(req, res) {
    res.render('login', { user: req.user });
  });

  options = {
    scope: [
      'user',
      'user:email',
      'repo',
      'repo:status',
      'read:repo_hook',
      'write:repo_hook'
    ],
    successRedirect: '/',
    failureRedirect: '/'
  };
  app.get('/auth/github', passport.authenticate('github', options), function(req, res) {});

  // GET /auth/github/callback
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  If authentication fails, the user will be redirected back to the
  //   login page.  Otherwise, the primary route function function will be called,
  //   which, in this example, will redirect the user to the home page.
  app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/');
    });

  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });
};

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

module.exports = Server;
