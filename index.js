var mongodb = require('mongodb');

mongodb.MongoClient.connect(process.env.MONGO_URL, function (err, db) {

    if (err) {
        return console.error("Could not connect to mongo ", err);
    }

    db.collectionNames(function (err, names) {
        console.log(names);
        db.close();
    });

});