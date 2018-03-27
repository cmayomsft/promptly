const { ConversationTopic, ConversationTopicState, Prompt, Validator } = require('promptly-bot');
const { StateBotContext } = require('../bot/StateBotContext');
const { BotConversationState, BotUserState } = require('../app');

class AddAlarmTopic extends ConversationTopic {
    constructor(state = { alarm: {}, activeTopic: undefined }) {
        super(state);    
        
        this.subTopics
            .set("titlePrompt", () => new Prompt()
                .onPrompt((context, lastTurnReason) => {
   
                    if(lastTurnReason && lastTurnReason === 'titletoolong') {
                        context.sendActivity(`Sorry, alarm titles must be less that 20 characters.`,
                            `Let's try again.`);
                    }
    
                    return context.sendActivity(`What would you like to name your alarm?`);
                })
                .validator(new AlarmTitleValidator())
                .maxTurns(2)
                .onSuccess((context, value) => {
                    this.clearActiveTopic();

                    this.state.alarm.title = value;
    
                    return this.onReceiveActivity(context);
                })
                .onFailure((context, reason) => {                    
                    this.clearActiveTopic();

                    if(reason && reason === 'toomanyattempts') {
                        context.sendActivity(`I'm sorry I'm having issues understanding you.`);
                    }
    
                    return this._onFailure(context, reason);
                })
            )
            .set("timePrompt", () => new Prompt()
                .onPrompt((context, lastTurnReason) => {
                    return context.sendActivity(`What time would you like to set your alarm for?`);
                })
                .validator(new AlarmTimeValidator())
                .maxTurns(2)
                .onSuccess((context, value) => {
                    this.clearActiveTopic();

                    this.state.alarm.time = value;
    
                    return this.onReceiveActivity(context);
                })
                .onFailure((context, reason) => {
                    this.clearActiveTopic();

                    if(reason && reason === 'toomanyattempts') {
                        return context.sendActivity(`I'm sorry I'm having issues understanding you.`);
                    }
    
                    return this._onFailure(context, reason);;
                })
            );
    };

    onReceiveActivity(context) {

        if(this.hasActiveTopic) { 
            return this.activeTopic.onReceiveActivity(context);
        }

        if (!this.state.alarm.title) {
            return this.setActiveTopic("titlePrompt")
                .onReceiveActivity(context);
        } 
        
        if (!this.state.alarm.time) {
            return this.setActiveTopic("timePrompt")
                .onReceiveActivity(context);
        }
        
        return this._onSuccess(context, this.state.alarm);
    }
}

class AlarmTitleValidator extends Validator {
    validate(context) {
        if(context.request.text.length > 20) {
            return { reason: 'titletoolong' };
        } else {
            return { value: context.request.text };
        }
    }
}

class AlarmTimeValidator extends Validator {
    validate(context) {
        return { value: context.request.text };
    }
}

module.exports = {
    AddAlarmTopic
};