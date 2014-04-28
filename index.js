var levelup = require('levelup'),
    express = require('express'),
    parseDuration = require('parse-duration'),
    gnuplot = require('gnuplot'),
    Args = require('args-js'),
    db = levelup('./db'),
    receiver = require('./lib/receiver')(db);

var port = process.argv[2] || 8125;
receiver.listen(port);
console.log("Receiver listening on port ", port);

function makeDense(metrics, start, end, duration) {
    var count = 0;
    var dense = {};
    var time = Math.floor(end / duration) * duration;
    while (time >= start && ++count < 10000) {
        dense[time] = metrics[time] || 0;
        time -= duration;        
    }
    return dense;
}

function getStartDate() {
    var date = new Date();
    date.setDate(date.getDate() - 1);
    return date.getTime();
}

function getEndDate() {
    var date = new Date();
    return date.getTime();
}

function getMetrics() {
    var args = Args([
        {name: Args.STRING | Args.Required},
        {start: Args.INT | Args.Optional, _default: getStartDate()},
        {end: Args.INT | Args.Optional, _default: getEndDate()},
        {agg: Args.STRING | Args.Optional, _default: '1 min'},
        {dense: Args.BOOL | Args.Optional, _default: false},
        {done: Args.FUNCTION | Args.Required},
    ], arguments);

    var metrics = {},
        duration = parseDuration(args.agg);
    db.createReadStream({
        start: args.name + '.' + args.start,
        end: args.name + '.' + args.end
    }).on('error', function (err) {
        args.done(err);
    }).on('data', function (data) {
        var millis = parseInt(data.key.substring(data.key.lastIndexOf('.') + 1), 10),
            key = Math.floor(millis / duration) * duration;
        metrics[key] = parseFloat(data.value) + (metrics[key] || 0);
    }).on('end', function () {
        if (args.dense) {
            metrics = makeDense(metrics, args.start, args.end, duration);
        }
        args.done(null, Object.keys(metrics).map(function (key) {
            return {
                time: parseInt(key, 10),
                value: metrics[key]
            };
        }).sort(function (a, b) {
            return a.time - b.time;
        }));
    });
}

var app = express();

app.get('/keys.json', function (req, res) {
    db.get('keys', function (err, value) {
        if (err) {
            return res.send(500, err);
        }
        res.set('Content-Type', 'application/json');
        var keys = JSON.parse(value).sort();
        res.send(keys);
    });
});

app.get('/metrics.svg', function (req, res) {
    var name = 'foo.bar.baz';
    var start = new Date();
    start.setHours(start.getHours() - 1);
    getMetrics({
        name: name,
        start: start.getTime(),
        done: function (err, metrics) {
            if (err) {
                return res.send(500, err);
            }
            var data = metrics.map(function (metric) {
                return metric.time + ' ' + metric.value;
            }).join('\n');
            console.log(data);
            res.set('Content-Type', 'image/svg+xml');
            gnuplot()
                .set('term svg')
                .unset('xtics')
                .plot('"-" using 1:2 title "' + name + '" with lines')
                .println(data, {end: true})
                .pipe(res);
        },
        agg: '1min',
        dense: true
    });
});

app.listen(8080);
