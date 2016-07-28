var Botkit = require('botkit');
var token =require('./token')
var Slack = require('node-slack-upload');
var uploadToken = 'xoxp-4345381608-6783470449-15737127058-1699815eb8'
var slack = new Slack(token);
var http = require('http');// Require the module
var Forecast = require('forecast');
var rsj = require('./rss');
var _ = require("lodash")
var os = require("os")
var fs = require("fs")
var path = require("path");
var CronJob = require('cron').CronJob;
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
        //new CronJob({
        //    cronTime: '* * * * 1-5',
        //    onTick: function() {
        //        bot.say({
        //            channel: 'pingpong',
        //            text: ':robot_face:Hello World !',
        //            username: 'terrybot',
        //            icon_url: '',
        //        });
        //    },
        //    start: true,
        //    timeZone: 'Asia/Hong_Kong'
        //});
    }


});

controller.hears(["weather"], ["mention", "direct_mention", "direct_message"], function(bot,message){
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
            var resReport = info[0].summary + '  high:  ' + info[0].temperatureMax + '  low:  ' + info[0].temperatureMin;
            controller.storage.users.get(message.user, function(err, user) {
                if (user && user.name) {
                    bot.reply(message, `${user.name} : ${resReport} !`);
                } else {
                    bot.reply(message, resReport);

                }
            })
        });
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
controller.hears(['your image', 'photo'], 'direct_message,direct_mention,mention', function(bot, message) {
    console.log(message)
    slack.uploadFile({
        file: fs.createReadStream("learningApp.png"),
        filetype: 'png',
        title: 'photo',
        initialComment: 'learning App',
        channels: message.channel
    }, function(err) {
        if (err) {
            console.log("Failed to add file :(",err)
            bot.reply(message, 'Sorry, there has been an error: '+err)
        }
    });
    //bot.api.files.upload({
    //    file: fs.createReadStream("file.txt"),
    //    filename: "file.txt",
    //    filetype: "txt",
    //    channels: message.channel
    //},function(err,res) {
    //    if (err) {
    //        console.log("Failed to add file :(",err)
    //        bot.reply(message, 'Sorry, there has been an error: '+err)
    //    }
    //    console.log(res)
    //})
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
