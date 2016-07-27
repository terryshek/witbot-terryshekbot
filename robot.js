var Botkit = require('botkit');
var token =require('./token')
var http = require('http');// Require the module
var Forecast = require('forecast');
var rsj = require('./rss');
var _ = require("lodash")
var os = require("os")
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
    //rsj.r2j('http://rss.weather.gov.hk/rss/SeveralDaysWeatherForecast.xml',function(json) {
    //    var loop = _.map(json, "items")
    //http.get({
    //    hostname: 'robohash.org/weather',
    //    path: '/',
    //    agent: false  // create a new agent just for this one request
    //}, (res) => {
    //    // Do stuff with response
    //    console.log(res)
    //});
        //bot.reply(message, json);
        // Initialize
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
            //console.log(weather.daily.data);
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
controller.hears(['attach'],['direct_message','direct_mention'],function(bot,message) {

    var attachments = [];
    var attachment = {
        title: 'This is an attachment',
        color: '#FFCC99',
        fields: [],
    };

    attachment.fields.push({
        label: 'Field',
        value: 'A longish value',
        short: false,
    });

    attachment.fields.push({
        label: 'Field',
        value: 'Value',
        short: true,
    });

    attachment.fields.push({
        label: 'Field',
        value: 'Value',
        short: true,
    });

    attachments.push(attachment);

    bot.reply(message,{
        text: 'See below...',
        attachments: attachments,
    },function(err,resp) {
        console.log(err,resp);
    });
});
// give the bot something to listen for.
controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    }, function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(', err);
        }
    });


    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hello ' + user.name + '!!');
        } else {
            bot.reply(message, 'Hello.');
        }
    });
});
controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});
controller.hears(['what is my name', 'who am i'], 'direct_message,direct_mention,mention', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Your name is ' + user.name);
        } else {
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.say('I do not know your name yet!');
                    convo.ask('What should I call you?', function(response, convo) {
                        convo.ask('You want me to call you `' + response.text + '`?', [
                            {
                                pattern: 'yes',
                                callback: function(response, convo) {
                                    // since no further messages are queued after this,
                                    // the conversation will end naturally with status == 'completed'
                                    convo.next();
                                }
                            },
                            {
                                pattern: 'no',
                                callback: function(response, convo) {
                                    // stop the conversation. this will cause it to end with status == 'stopped'
                                    convo.stop();
                                }
                            },
                            {
                                default: true,
                                callback: function(response, convo) {
                                    convo.repeat();
                                    convo.next();
                                }
                            }
                        ]);

                        convo.next();

                    }, {'key': 'nickname'}); // store the results in a field called nickname

                    convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            bot.reply(message, 'OK! I will update my dossier...');

                            controller.storage.users.get(message.user, function(err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user,
                                    };
                                }
                                user.name = convo.extractResponse('nickname');
                                controller.storage.users.save(user, function(err, id) {
                                    bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                                });
                            });



                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'OK, nevermind!');
                        }
                    });
                }
            });
        }
    });
});
controller.hears(['dm me'],['direct_message','direct_mention'],function(bot,message) {
    bot.startConversation(message,function(err,convo) {
        convo.say('Heard ya');
    });

    bot.startPrivateConversation(message,function(err,dm) {
        dm.say('Private reply!');
    });

});
function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}
controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
    'direct_message,direct_mention,mention', function(bot, message) {

        var hostname = os.hostname();
        var uptime = formatUptime(process.uptime());

        bot.reply(message,
            ':robot_face: I am a bot named <@' + bot.identity.name +
            '>. I have been running for ' + uptime + ' on ' + hostname + '.');

});