var express = require('express');
var app = express();
var everyauth = require('everyauth');

var mongojs = require('mongojs');

var mongoUri = process.env.MONGOLAB_URI ||
               process.env.MONGOHQ_URL ||
               'mongodb://localhost/cookie-friends'; 

var db = mongojs(mongoUri, ["users", "cookies"]);

require('./fbLogin')(everyauth, db);
app.configure(require('./config')(everyauth, express, app));

everyauth.everymodule.findUserById(function(userId, callback) {
    // use this to serialize each user for each request (probably cached though)
    db.users.findOne({id: userId}, callback);
});

require('./routes.js')(app, db);


///////////// and run the app :) ////////////////////
app.listen(process.env.PORT || 8080, function() {
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
