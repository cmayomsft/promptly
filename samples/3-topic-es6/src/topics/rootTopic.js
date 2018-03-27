const { TopicsRoot, ConversationTopicState, Prompt, Validator, ValidatorResult } = require('promptly-bot');
const { BotConversationState, BotUserState } = require('../app');
const { StateBotContext } = require('../bot/StateBotContext');
const { AddAlarmTopic } = require('./addAlarmTopic');

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
            );
    }

    onReceiveActivity(context) { 

        if (context.request.type === 'message' && context.request.text.length > 0) {
            
            // If the user wants to change the topic of conversation...
            if (/add alarm/i.test(context.request.text)) {

                // Set the active topic and let the active topic handle this turn.
                return this.setActiveTopic("addAlarmTopic")
                    .onReceiveActivity(context);
            }

            // If there is an active topic, let it handle this turn.
            if (this.hasActiveTopic) {
                return this.activeTopic.onReceiveActivity(context);
            }

            return this.showDefaultMessage(context);
        }
    }

    showDefaultMessage(context) {
        context.sendActivity("'Add Alarm'.");
    }
}

module.exports = {
    RootTopic
};
