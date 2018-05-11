import { StateContext } from 'botbuilder-botbldr';
import { TopicsRoot, ConversationTopicState } from 'promptly-bot';
import { BotConversationState, BotUserState } from '../app';
import { Alarm, showAlarms } from '../models/alarms';
import { AddAlarmTopic } from './addAlarmTopic';
import { DeleteAlarmTopic } from './deleteAlarmTopic';

export interface RootTopicState extends ConversationTopicState { }

export class RootTopic 
    extends TopicsRoot<
        StateContext<BotConversationState, BotUserState>, 
        BotConversationState, 
        RootTopicState> {

    public constructor(context: StateContext<BotConversationState, BotUserState>) {
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
            .set("deleteAlarmTopic", (alarms: Alarm[]) => new DeleteAlarmTopic(alarms)
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

    public onReceiveActivity(context: StateContext<BotConversationState, BotUserState>) { 

        if (context.activity.type === 'message' && context.activity.text.length > 0) {
             
            // If the user wants to change the topic of conversation...
            if (/show alarms/i.test(context.activity.text)) {
                this.clearActiveTopic();

                return showAlarms(context, context.userState.alarms);
            } else if (/add alarm/i.test(context.activity.text)) {

                // Set the active topic and let the active topic handle this turn.
                return this.setActiveTopic("addAlarmTopic")
                    .onReceiveActivity(context);
            } else if (/delete alarm/i.test(context.activity.text)) {

                return this.setActiveTopic("deleteAlarmTopic", context.userState.alarms)
                    .onReceiveActivity(context);
            } else if (/help/i.test(context.activity.text)) {
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

    public showDefaultMessage(context: StateContext<BotConversationState, BotUserState>) {
        context.sendActivity("'Show Alarms', 'Add Alarm', 'Delete Alarm', 'Help'.");
    }
        
    private showHelp(context: StateContext<BotConversationState, BotUserState>) {
        let message = "Here's what I can do:\n\n";
        message += "To see your alarms, say 'Show Alarms'.\n\n";
        message += "To add an alarm, say 'Add Alarm'.\n\n";
        message += "To delete an alarm, say 'Delete Alarm'.\n\n";
        message += "To see this again, say 'Help'.";
    
        context.sendActivity(message);
    }
}