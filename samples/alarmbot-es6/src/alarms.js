const { BotContext } = require( 'botbuilder');
const { BotConversationState, BotUserState } = require( './app');
const { StateBotContext } = require( './bot/StateBotContext');

exports.findAlarmIndex = function (alarms, title) {
    return alarms.findIndex((alarm) => {
        return alarm.title.toLowerCase() === title.toLowerCase();
    });
}

exports.showAlarms = function (context, alarms) {
    if (!alarms || (alarms.length === 0)) {
        context.sendActivity(`You have no alarms.`);
        return;
    }

    if (alarms.length == 1) {
        context.sendActivity(`You have one alarm named '${alarms[0].title}', set for ${alarms[0].time}.`);
        return;
    }

    let message = `You have ${alarms.length} alarms: \n\n`;

    alarms.forEach((alarm) => {
        message += `'${alarm.title}' set for ${alarm.time}\n\n`;
    });

    context.sendActivity(message);
}