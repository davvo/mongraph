var net = require('net');

module.exports = function (db) {

    "use strict";

    var keys = [];

    db.get('keys', function (err, value) {
        if (err) {
            console.warn('Unable to get keys: ', err.message);
        } else {
            keys = JSON.parse(value);
            console.log("keys = ", keys)
        }
    });

    function addKey(key)  {
        if (keys.indexOf(key) < 0) {
            keys.push(key);
            db.put('keys', JSON.stringify(keys));
        }
    }

    return net.createServer(function (socket) {

        var buf = '';

        socket.on('data', function (data) {
            buf += data.toString();
            if (buf.indexOf('\n') > 0) {
                var match, 
                    batch = [],
                    lastIndex = 0,
                    re = /([\w\.]+)\s+(\d+)\s+(\d+)\n/g;
                while ((match = re.exec(buf)) !== null) {
                    addKey(match[1]);
                    batch.push({
                        type: 'put',
                        key: match[1] + '.' + parseInt(match[3], 10),
                        value: parseInt(match[2], 10)
                    });
                    lastIndex = re.lastIndex;
                }
                console.log(batch);
                db.batch(batch);
                buf = buf.substring(lastIndex);
            }
        });

    });

};