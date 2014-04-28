var net = require('net');

function getData() {
    var key = 'foo.bar.baz',
        value = Math.floor(Math.random() * 100),
        time = new Date().getTime();
    return [key, value, time].join(' ') + '\n';
}

var client = net.connect({port: 2003}, function () {
    (function send() {
        var i, data = [];
        for (i = 0; i < Math.random() * 10; ++i) {
            data.push(getData());
        }
        console.log(data.join(''));
        client.write(data.join(''));
        setTimeout(send, Math.random() * 3000);
    }());
});
