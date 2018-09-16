const { TopicsRoot, ConversationTopicState, Prompt, Validator, ValidatorResult } = require('promptly-bot');
const { BotConversationState, BotUserState } = require('../app');
const { StateBotContext } = require('../bot/StateBotContext');

class RootTopic extends TopicsRoot {
    constructor(context) {
        super(context);

        this.subTopics
            .set("namePrompt", () => new Prompt()
                .onPrompt((context, lastTurnReason) => {

                    return context.sendActivity(`What is your name?`);
                })
                .validator(new TextValidator())
                .maxTurns(2)
                .onSuccess((context, value) => {
                    this.clearActiveTopic();

                    this.state.name = value;

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
            .set("agePrompt", () => new Prompt()
                .onPrompt((context, lastTurnReason) => {

                    return context.sendActivity(`How old are you?`);
                })
                .validator(new IntValidator())
                .maxTurns(2)
                .onSuccess((context, value) => {
                    this.clearActiveTopic();

                    this.state.age = value;

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

    }

    onReceiveActivity(context) { 

        if (context.request.type === 'message') {
            
            // Check to see if there is an active topic.
            if (this.hasActiveTopic) {
                // Let the active topic handle this turn by passing context to it's OnReceiveActivity().
                return this.activeTopic.onReceiveActivity(context);
            }

            // If you don't have the state you need, prompt for it
            if (!this.state.name) {
                return this.setActiveTopic("namePrompt")
                    .onReceiveActivity(context);
            }

            if (!this.state.age) {
                return this.setActiveTopic("agePrompt")
                    .onReceiveActivity(context);                
            }

            // Now that you have the state you need (age and name), use it!
            return context.sendActivity(`Hello ${ this.state.name }! You are ${ this.state.age } years old.`);
        }
    }

    showDefaultMessage(context) {
        context.sendActivity("'Add Alarm'.");
    }
}

class TextValidator extends Validator {
    validate(context) {
        if((context.request.text) && (context.request.text.length > 0)) {
            return { value: context.request.text };
        } else {
            return { reason: "nottext" };
        }
    }
}

class IntValidator extends Validator {
    validate(context) {
        if((context.request.text) && (!Number.isNaN(parseInt(context.request.text)))) {
            return { value: parseInt(context.request.text) };
        } else {
            return { reason: "notint" };
        }
    }
}

module.exports = {
    RootTopic,
    TextValidator,
    IntValidator
}
