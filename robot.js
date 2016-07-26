var Botkit = require('botkit');
var token =require('./token')
var http = require('http');// Require the module
var Forecast = require('forecast');
var rsj = require('./rss');
var _ = require("lodash")


var controller = Botkit.slackbot({
    debug: false
});

// connect the bot to a stream of messages
var bot = controller.spawn({
        token:token,
})

bot.startRTM(function(err,bot,payload)
{
    if (err)
    {
        throw new Error('Could not connect to Slack');
    }else{
        console.log("Connect to slack !")
    }

});
controller.hears(["weather"], ["mention", "direct_mention", "direct_message"], function(bot,message){
    var HongKongWeather = require('hongkong-weather');

    var hkWeather = HongKongWeather();


    //hkWeather.getForecast()
    //    .then(function(forecast) {
    //        var prettyJSON = JSON.stringify(forecast,null,1);
    //        console.log(prettyJSON);
    //    });
        //// Initialize
        var forecast = new Forecast({
            service: 'forecast.io',
            key: '536b6a4003160ba851dcab068e91dddb',
            units: 'celcius', // Only the first letter is parsed
            cache: true,      // Cache API requests?
            ttl: {            // How long to cache requests. Uses syntax from moment.js: http://momentjs.com/docs/#/durations/creating/
                minutes: 27,
                seconds: 45
            }
        });
        forecast.get([22.2855200, 114.1576900], function(err, weather) {
            if(err) return console.dir(err);
            console.log(HongKongWeather());
            var info = weather.daily.data
            bot.reply(message,
                'Summary: '+info[0].summary +
                '  high:  ' + info[0].temperatureMax +
                '  low:  ' + info[0].temperatureMin);
        });
});
// give the bot something to listen for.
controller.hears('hello',['direct_message','direct_mention','mention'],function(bot,message) {

    console.log(message)
    bot.reply(message,'Hello yourself.');

});