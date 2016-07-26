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
    //})

    //var txt = message.text;
    //txt = txt.toLowerCase().replace('weather ','');
    //console.log(txt)
    //var city = txt.split(',')[0].trim().replace(' ','_');
    //var state = txt.split(',')[1].trim();
    //
    //console.log(city + ', ' + state);
    //var url = '/api/' + key + '/forecast/q/state/city.json'
    //url = url.replace('state', state);
    //url = url.replace('city', city);
    //
    //http.get({
    //    host: 'api.wunderground.com',
    //    path: url
    //}, function(response){
    //    var body = '';
    //    response.on('data',function(d){
    //        body += d;
    //    })
    //    response.on('end', function(){
    //        var data = JSON.parse(body);
    //        var days = data.forecast.simpleforecast.forecastday;
    //        for(i = 0;i<days.length;i++)
    //        {
    //            bot.reply(message, days[i].date.weekday +
    //                ' high: ' + days[i].high.fahrenheit +
    //                ' low: ' + days[i].low.fahrenheit +
    //                ' condition: ' + days[i].conditions);
    //            bot.reply(message, days[i].icon_url);
    //        }
    //    })
    //})
});
// give the bot something to listen for.
controller.hears('hello',['direct_message','direct_mention','mention'],function(bot,message) {

    console.log(message)
    bot.reply(message,'Hello yourself.');

});