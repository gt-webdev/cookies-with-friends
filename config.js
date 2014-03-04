
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

module.exports = function(everyauth, express, app) {
    return function() {
        app.use(express.bodyParser()) // access to request variables (req.body, req.query maybe)
           .use(express.logger()) // log each request
           .use(express.favicon()) // control cache limit .. ?
           .use(express.cookieParser()) // have cookies parsed as object (req.cookies)
           .use(express.session({secret: process.env.SECRET || "SECRET"})) // encrypt cookies
           .use(everyauth.middleware(app)) // req.user for routes and everyauth.user for views.
           .use(express.static(__dirname + "/public")) // serve assets from "public" directory in this dir 
           .use(requireLoginMiddleware) // custom middleware for forcing user to login with facebook
           .use(app.router); // enable app.get(path, fn)
        app.set('view engine', 'ejs');
    }
}
