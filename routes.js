
var cookiesUrls = ["frosted-sugar-cookies.jpg", "oatmeal-raisin-cookies.jpg",
                "double-chocolate-chip.jpg",  "macademia-nut.jpg","sugar-cookie.jpg"].map(
                    function(c) {return "/images/" + c;});
module.exports = function(app, db) {
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
}
