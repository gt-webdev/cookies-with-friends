var express = require('express');
var app = express();
var everyauth = require('everyauth');

everyauth.debug = true;

users = {}; // object of UserID -> User
app.configure('production', function() {
    everyauth.facebook
        .appId(process.env.FB_APP_ID)
        .appSecret(process.env.FB_APP_SECRET)
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
        }).redirectPath('/user');
});

app.configure('development', function() {

});

app.use(express.bodyParser())
   .use(express.logger())
   .use(express.cookieParser())
   .use(express.session({secret: "SECRET"}))
   .use(everyauth.middleware(app))
   .use(app.router);

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
    res.send("HELLO " + req.user);
});

app.listen(8080);
console.log("I am listening");
