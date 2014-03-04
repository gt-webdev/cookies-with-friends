var express = require('express');
var app = express();
var everyauth = require('everyauth');

//everyauth.debug = true;
/*var mongo = require('mongojs');

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/cookie-friends'; */

users = {}; // object of UserID -> User
cookiesUrls = ["frosted-sugar-cookies.jpg", "oatmeal-raisin-cookies.jpg",
                "double-chocolate-chip.jpg",  "macademia-nut.jpg","sugar-cookie.jpg"].map(
                    function(c) {return "/images/" + c;});
cookies = {1352214896: [{
      cookieImage: cookiesUrls[Math.floor(Math.random(cookiesUrls.length))],
      cookieFrom: "STEVE",
      cookieFromId: 123,
      read: false
    }
]}; 

everyauth.facebook
    .appId(process.env.FB_APP_ID)
    .appSecret(process.env.FB_APP_SECRET)
    .scope('email')
    .fields('id,name,email,picture') 
    .handleAuthCallbackError( function(req, res) {
        res.send("There was an error");
    })
    .findOrCreateUser(function(session, accessToken, accessTokenExtra, fbUserMetadata) {
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
    .redirectPath('/');

var loginRegex = /\/auth\/*/;
var publicRegex = /\/public\/*/
var requireLogin = function(req, res, next) {
    if(req.user) {return next();}
    // make sure they're not trying to log in or out
    if(req.path === "/" || 
       req.path === "/login" || 
       req.path === "/logout" || 
       loginRegex.test(req.path) ||
       publicRegex.test(req.path)) {
        return next();
    }
    return res.redirect("/");
};

app.use(express.bodyParser())
   .use(express.logger())
   .use(express.favicon())
   .use(express.cookieParser())
   .use(express.session({secret: process.env.SECRET || "SECRET"}))
   .use(everyauth.middleware(app)) // req.user, 
   .use(express.static(__dirname + "/public"))
   .use(requireLogin)
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
        res.render('user/home', {currentUsers: users});
    }else {
        res.render('home');
    }
});

app.post("/cookies", function(req, res) {
    if(!cookies[req.body.to]) {cookies[req.body.to] = [];}
    cookies[req.body.to].push({
      cookieImage: cookiesUrls[Math.floor(Math.random() * cookiesUrls.length)],
      cookieFrom: req.user.name,
      cookieFromId: req.user.id,
      read: false
    });
    res.send("OK");
});

app.get("/cookies", function(req, res) {
    var userCookies = cookies[req.user.id];
    console.log(userCookies);
    var remainingCookies = [];
    for(var i = userCookies.length - 1; i >= 0; i--) {
        console.log(userCookies[i]);
        if(!userCookies[i].read) {
            userCookies[i].read = true;
            remainingCookies.push(userCookies[i]);
        }else {break;}
    }    
    res.render('user/cookies', {cookies: remainingCookies});
});

app.listen(process.env.PORT || 8080, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
