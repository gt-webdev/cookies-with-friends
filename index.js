var express = require('express');
var app = express();
var everyauth = require('everyauth');

everyauth.debug = true;
var mongo = require('mongodb');

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/cookie-friends';

users = {}; // object of UserID -> User
everyauth.facebook
    .appId(process.env.FB_APP_ID)
    .appSecret(process.env.FB_APP_SECRET)
    .scope('email')
    .fields('id,name,email,picture') 
    .handleAuthCallbackError( function(req, res) {
        console.log(req);
    })
    .findOrCreateUser(function(session, accessToken, accessTokenExtra, fbUserMetadata) {
        console.log("HI");
        var promise = this.Promise();
        if(users[fbUserMetadata.id]) {
            promise.fulfill(users[fbUserMetadata.id]);
        }else { // create user on server
            users[fbUserMetadata.id] = {
                id: fbUserMetadata.id,
                name: fbUserMetadata.name,
                email: fbUserMetadata.email,
                facebook: fbUserMetadata
            };
            promise.fulfill(users[fbUserMetadata.id]);
        }
        return promise;
    })
    .findUserById(function() {
        console.log(arguments); 
    })
    .redirectPath('/user');

console.log(everyauth.facebook.configurable());

app.use(express.bodyParser())
   .use(express.logger())
   .use(express.favicon())
   .use(express.cookieParser())
   .use(express.session({secret: process.env.SECRET || "SECRET"}))
   .use(everyauth.middleware(app)) // req.user, 
   .use(app.router); // use app.get( path, fn)

app.set('view engine', 'ejs');

everyauth.everymodule.findUserById(function(userId, callback) {
   console.log("FIND USER");
   var user = users[userId] 
   var err = null;
   if(!user) {err = "No such user!"}
   callback(err, user);
});

app.get("/", function(req, res) {
    if(req.user) {
        res.send("Not logged in " + req.user);
    }else {

    }
});

app.get("/user", function(req, res) {
    res.send("HELLO " + JSON.stringify(req.user));
});

app.listen(process.env.PORT || 8080, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
