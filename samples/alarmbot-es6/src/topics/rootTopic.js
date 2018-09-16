const { TopicsRoot, ConversationTopicState } = require('promptly-bot');
const { BotConversationState, BotUserState } = require('../app');
const { StateBotContext } = require('../bot/StateBotContext');
const { showAlarms } = require('../alarms');
const { AddAlarmTopic } = require('./addAlarmTopic');
const { DeleteAlarmTopic } = require('./deleteAlarmTopic');

class RootTopic extends TopicsRoot {
    constructor(context) {
        super(context);

        // User state initialization should be done once in the welcome 
        //  new user feature. Placing it here until that feature is added.
        if (!context.userState.alarms) {
            context.userState.alarms = [];
        }

        this.subTopics
            .set("addAlarmTopic", () => new AddAlarmTopic()
                .onSuccess((context, value) => {
                    this.clearActiveTopic();
                
                    context.userState.alarms.push({
                        title: value.title,
                        time: value.time
                    });

                    return context.sendActivity(`Added alarm named '${ value.title }' set for '${ value.time }'.`);
                })
                .onFailure((context, reason) => {
                    this.clearActiveTopic();

                    if(reason && reason === 'toomanyattempts') {
                        context.sendActivity(`Let's try something else.`);
                    }

                    return this.showDefaultMessage(context);
                })
            )
            .set("deleteAlarmTopic", (alarms) => new DeleteAlarmTopic(alarms)
                .onSuccess((context, value) => {
                    this.clearActiveTopic();

                    if(!value.deleteConfirmed) {
                        return context.sendActivity(`Ok, I won't delete alarm ${value.alarm.title}.`);
                    }

                    context.userState.alarms.splice(value.alarmIndex, 1);

                    return context.sendActivity(`Done. I've deleted alarm '${value.alarm.title}'.`);
                })
                .onFailure((context, reason) => {
                    this.clearActiveTopic();
                    
                    if(reason && reason === 'toomanyattempts') {
                        context.sendActivity(`Let's try something else.`);
                    }

                    return this.showDefaultMessage(context);
                })
            );
    }

    onReceiveActivity(context) { 

        if (context.request.type === 'message' && context.request.text.length > 0) {
             
            // If the user wants to change the topic of conversation...
            if (/show alarms/i.test(context.request.text)) {
                this.clearActiveTopic();

                return showAlarms(context, context.userState.alarms);
            } else if (/add alarm/i.test(context.request.text)) {

                // Set the active topic and let the active topic handle this turn.
                return this.setActiveTopic("addAlarmTopic")
                    .onReceiveActivity(context);
            } else if (/delete alarm/i.test(context.request.text)) {

                return this.setActiveTopic("deleteAlarmTopic", context.userState.alarms)
                    .onReceiveActivity(context);
            } else if (/help/i.test(context.request.text)) {
                this.clearActiveTopic();

                return this.showHelp(context);
            }

            // If there is an active topic, let it handle this turn.
            if (this.hasActiveTopic) {
                return this.activeTopic.onReceiveActivity(context);
            }

            return this.showDefaultMessage(context);
        }
    }

    showDefaultMessage(context) {
        context.sendActivity("'Show Alarms', 'Add Alarm', 'Delete Alarm', 'Help'.");
    }
        
    showHelp(context) {
        let message = "Here's what I can do:\n\n";
        message += "To see your alarms, say 'Show Alarms'.\n\n";
        message += "To add an alarm, say 'Add Alarm'.\n\n";
        message += "To delete an alarm, say 'Delete Alarm'.\n\n";
        message += "To see this again, say 'Help'.";
    
        context.sendActivity(message);
    }
}

module.exports = {
    RootTopic
};