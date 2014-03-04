var express = require('express');
var app = express();
var everyauth = require('everyauth');

var mongojs = require('mongojs');

var mongoUri = process.env.MONGOLAB_URI ||
               process.env.MONGOHQ_URL ||
               'mongodb://localhost/cookie-friends'; 

var db = mongojs(mongoUri, ["users", "cookies"]);

var cookiesUrls = ["frosted-sugar-cookies.jpg", "oatmeal-raisin-cookies.jpg",
                "double-chocolate-chip.jpg",  "macademia-nut.jpg","sugar-cookie.jpg"].map(
                    function(c) {return "/images/" + c;});

//////////// Everyauth facebook //////////////////
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
        db.users.save({
                    _id: fbUserMetadata.id, // ugly hack to create if not exist
                    id: fbUserMetadata.id,
                    name: fbUserMetadata.name,
                    email: fbUserMetadata.email,
                    facebook: fbUserMetadata
                }
        , function(err, doc, lastErrObj) {
            if(err) throw err;
            promise.fulfill(doc);
        });
        return promise;
    })
    .redirectPath('/');

/////////// App Middleware ///////////////
var loginRegex = /\/auth\/*/;
var publicRegex = /\/public\/*/
var requireLoginMiddleware = function(req, res, next) {
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

app.use(express.bodyParser()) // access to request variables (req.body, req.query maybe)
   .use(express.logger()) // log each request
//   .use(express.favicon()) // control cache limit .. ?
   .use(express.cookieParser()) // have cookies parsed as object (req.cookies)
   .use(express.session({secret: process.env.SECRET || "SECRET"})) // encrypt cookies
   .use(everyauth.middleware(app)) // req.user for routes and everyauth.user for views.
   .use(express.static(__dirname + "/public")) // serve assets from "public" directory in this dir 
   .use(requireLoginMiddleware) // custom middleware for forcing user to login with facebook
   .use(app.router); // enable app.get(path, fn)

app.set('view engine', 'ejs');

everyauth.everymodule.findUserById(function(userId, callback) {
    // use this to serialize each user for each request (probably cached though)
    db.users.findOne({id: userId}, callback);
});

/////////////////// app routes //////////////////////

app.get("/", function(req, res) {
    if(req.user) {
        db.users.find({}, function(err, docs) {
            if(err) {throw err;}
            res.render('user/home', {currentUsers: docs});
        });
    }else {
        res.render('home');
    }
});

app.post("/cookies", function(req, res) {
    // add a cookie for the user
    db.cookies.update(
        {
            id: req.body.to 
        },
        {
          $push: {
              cookies: {
                      cookieImage: cookiesUrls[Math.floor(Math.random() * cookiesUrls.length)],
                      cookieFrom: req.user.name,
                      cookieFromId: req.user.id,
                      read: false
                  }
              }
        }, 
        {upsert: true},
    function(err, doc) {
        if(err) throw err;
        res.send("OK");
    });
});

app.get("/cookies", function(req, res) {
    // get all unread cookies, and mark them as read
    db.cookies.find({
        $and: [ {cookies: {$elemMatch: {read: false}}},
                {id: req.user.id}]
    }, 
    function(err, docs) {
        if(err) {throw err;}
        if(docs.length == 0) {
            return res.render('user/cookies', {cookies: []});
        }
        var cookies = docs[0].cookies;
        var unseenCookies = [];
        for(var i = cookies.length - 1; i >= 0 && !cookies[i].read; i--) {
            unseenCookies.push(cookies[i]);        
        }
        res.render('user/cookies', {cookies: unseenCookies});
        var newCookies = cookies.map(function(c) {
            var copy = JSON.stringify(c);
            copy = JSON.parse(copy);
            copy.read = true;
            return copy;
        });
        var doc = docs[0];
        doc.cookies = newCookies;
        db.cookies.save(doc);
    });
});

///////////// and run the app :) ////////////////////
app.listen(process.env.PORT || 8080, function() {
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
