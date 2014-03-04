module.exports = function(everyauth, db) {
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
                        _id: fbUserMetadata.id, // hack to create if not exist
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
}
