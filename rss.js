exports.r2j = r2j;

var Feed = require('rss-to-json');

function r2j(uri, cb) {
    Feed.load(uri, function (err, rss) {
        if (err) return console.error(err);
        cb(JSON.stringify(rss));
    });
}