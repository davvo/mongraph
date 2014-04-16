var net = require('net'),
    mongodb = require('mongodb');

mongodb.MongoClient.connect(process.env.MONGO_URL, function (err, db) {

    if (err) {
        return console.error("Could not connect to mongo ", err);
    }

    var server = net.createServer(function (socket) {

        var buf = [];

        socket.on('data', function (data) {
            buf.push(data);
        });

        socket.on('end', function () {
            var data = Buffer.concat(buf).toString();
            var match, re = /([\w\.]+)\s+(\d+)\s+(\d+)\n/g;
            while ((match = re.exec(data)) !== null) {
                var key = match[1],
                    value = parseInt(match[2]),
                    time = new Date(Math.floor(parseInt(match[3]) / 60000) * 60000);

                db.collection(key).save({
                    '_id': time,
                    'value': value
                }, {
                    'safe': false
                });

                console.log(key, value, time);
            }
        });

    });

    var port = process.argv[2] || 8125;
    server.listen(port);
    console.log("Receiver listening on port ", port);

});