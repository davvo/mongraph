var net = require('net');

module.exports = function (db) {

    "use strict";

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