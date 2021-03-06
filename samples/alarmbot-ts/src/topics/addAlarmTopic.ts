import { StateContext } from 'botbuilder-botbldr';
import { Alarm } from '../models/alarms';
import { ConversationTopic, ConversationTopicState, Prompt, Validator } from 'promptly-bot';
import { BotConversationState, BotUserState } from '../app';
import { ResourceResponse } from 'botbuilder';

export interface AddAlarmTopicState extends ConversationTopicState {
    alarm: Alarm;
}

export class AddAlarmTopic extends ConversationTopic<StateContext<BotConversationState, BotUserState>, AddAlarmTopicState, Alarm> {

    public constructor(state: AddAlarmTopicState = { alarm: {} as Alarm, activeTopic: undefined }) {
        super(state);    
        
        this.subTopics
            .set("titlePrompt", () => new Prompt<StateContext<BotConversationState, BotUserState>, string>()
                .onPrompt(async (context, lastTurnReason) => {
   
                    if(lastTurnReason && lastTurnReason === 'titletoolong') {
                        await context.sendActivity(`Sorry, alarm titles must be less that 20 characters.`,
                            `Let's try again.`);
                    }

                    return context.sendActivity(`What would you like to name your alarm?`);
                })
                .validator(new AlarmTitleValidator())
                .maxTurns(2)
                .onSuccess((context, value) => {
                    this.clearActiveTopic();

                    this.state.alarm.title = value;
    
                    return this.onTurn(context);
                })
                .onFailure(async (context, reason) => {                    
                    this.clearActiveTopic();

                    if(reason && reason === 'toomanyattempts') {
                        await context.sendActivity(`I'm sorry I'm having issues understanding you.`);
                    }
    
                    return this._onFailure!(context, reason);
                })
            )
            .set("timePrompt", () => new Prompt<StateContext<BotConversationState, BotUserState>, string>()
                .onPrompt((context, lastTurnReason) => {
                    return context.sendActivity(`What time would you like to set your alarm for?`);
                })
                .validator(new AlarmTimeValidator())
                .maxTurns(2)
                .onSuccess((context, value) => {
                    this.clearActiveTopic();

                    this.state.alarm.time = value;
    
                    return this.onTurn(context);
                })
                .onFailure(async (context, reason) => {
                    this.clearActiveTopic();

                    if(reason && reason === 'toomanyattempts') {
                        await context.sendActivity(`I'm sorry I'm having issues understanding you.`);
                    }
    
                    return this._onFailure!(context, reason);;
                })
            );
    };

    public onTurn(context: StateContext<BotConversationState, BotUserState>) {

        if(this.hasActiveTopic) { 
            return this.activeTopic!.onTurn(context);
        }

        if (!this.state.alarm.title) {
            return this.setActiveTopic("titlePrompt")
                .onTurn(context);
        } 
        
        if (!this.state.alarm.time) {
            return this.setActiveTopic("timePrompt")
                .onTurn(context);
        }
        
        return this._onSuccess!(context, this.state.alarm);
    }
}

class AlarmTitleValidator extends Validator<StateContext<BotConversationState, BotUserState>, string> {
    public validate(context: StateContext<BotConversationState, BotUserState>) {
        if(context.activity.text.length > 20) {
            return { reason: 'titletoolong' };
        } else {
            return { value: context.activity.text };
        }
    }
}

class AlarmTimeValidator extends Validator<StateContext<BotConversationState, BotUserState>, string> {
    public validate(context: StateContext<BotConversationState, BotUserState>) {
        return { value: context.activity.text };
    }
}