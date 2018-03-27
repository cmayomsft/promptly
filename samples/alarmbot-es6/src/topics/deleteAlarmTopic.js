const { ConversationTopic, ConversationTopicState, Prompt, Validator } = require('promptly-bot');
const { showAlarms } = require('../alarms');
const { StateBotContext } = require('../bot/StateBotContext');
const { BotConversationState, BotUserState } = require('../app');

class DeleteAlarmTopic extends ConversationTopic {

    constructor(alarms, state = { alarms: [], alarm: {}, activeTopic: undefined }) {
        super(state);

        if(alarms) {
            this.state.alarms = alarms;
        }

        this.subTopics
            .set("whichAlarmPrompt", () => new Prompt()
                .onPrompt((context, lastTurnReason) => {                           
                    if(lastTurnReason && lastTurnReason === 'indexnotfound') {
                        context.sendActivity(`Sorry, I coulnd't find an alarm named '${context.request.text}'.`,
                            `Let's try again.`);
                    }
                    
                    showAlarms(context, this.state.alarms);
    
                    return context.sendActivity(`Which alarm would you like to delete?`);
                })
                .validator(new AlarmIndexValidator(this.state.alarms))
                .maxTurns(2)
                .onSuccess((context, value) => {
                    this.clearActiveTopic();

                    this.state.alarmIndex = value;
    
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
            .set("confirmDeletePrompt", () => new Prompt()
                .onPrompt((context, lastTurnReason) => {
                    if(lastTurnReason && lastTurnReason === 'notyesorno') {
                        context.sendActivity(`Sorry, I was expecting 'yes' or 'no'.`,
                            `Let's try again.`);
                    }
    
                    return context.sendActivity(`Are you sure you want to delete alarm '${ this.state.alarm.title }' ('yes' or 'no')?`);
                })
                .validator(new YesOrNoValidator())
                .maxTurns(2)
                .onSuccess((context, value) => {
                    this.clearActiveTopic();

                    this.state.deleteConfirmed = value;
    
                    return this.onReceiveActivity(context);
                })
                .onFailure((context, reason) => {
                    this.clearActiveTopic();
                    
                    if(reason && reason === 'toomanyattempts') {
                        context.sendActivity(`I'm sorry I'm having issues understanding you.`);
                    }
    
                    return this._onFailure(context, reason);;
                })
            );
    }

    onReceiveActivity(context) {

        if(this.hasActiveTopic) { 
            return this.activeTopic.onReceiveActivity(context);
        }

        // If there are no alarms to delete...
        if (this.state.alarms.length === 0) {
            return context.sendActivity(`There are no alarms to delete.`);
        }

        if (this.state.alarmIndex === undefined) {
            // If there is only one alarm to delete, use that index. No need to prompt.
            if (this.state.alarms.length === 1) {
                showAlarms(context, this.state.alarms);

                this.state.alarmIndex = 0;
            } else {
                return this.setActiveTopic("whichAlarmPrompt")
                    .onReceiveActivity(context);
            }
        }

        this.state.alarm.title = this.state.alarms[this.state.alarmIndex].title;
    
        if (this.state.deleteConfirmed === undefined) {
            return this.setActiveTopic("confirmDeletePrompt")
                .onReceiveActivity(context);
        }

        return this._onSuccess(context, { alarm: this.state.alarm, alarmIndex: this.state.alarmIndex, deleteConfirmed: this.state.deleteConfirmed });
    }
}

class AlarmIndexValidator extends Validator {
    constructor(alarms) {
        super();
        this._alarms = alarms;
    }

    validate(context) {
        const index = this._alarms.findIndex((alarm) => {
            return alarm.title.toLowerCase() === context.request.text.toLowerCase();
        });

        if(index > -1) {
            return { value: index };
        } else {
            return { reason: 'indexnotfound' };
        }
    }
}

class YesOrNoValidator extends Validator {
    validate(context) {
        if(context.request.text === 'yes') {
            return { value: true };
        } else if(context.request.text === 'no') {
            return { value: false };
        } else {
            return { reason: 'notyesorno' };
        }
    }
}

module.exports = {
    DeleteAlarmTopic
};