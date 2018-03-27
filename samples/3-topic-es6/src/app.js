const { PromptlyBotConversationState } = require('promptly-bot');
const { BotFrameworkBot, StateBotContext } = require('./bot/BotFrameworkBot');
const { RootTopic , RootTopicState } = require('./topics/rootTopic');

const alarmBot = new BotFrameworkBot();

alarmBot.onReceiveActivity(async context => {
    // State isn't fully initialized until the contact/conversation messages are sent, so have to require
    //  activity type is message. Will affect welcome message. Refactor after bug has been addressed.
    if(context.request.type === 'message') {
        
        return new RootTopic(context)
            .onReceiveActivity(context);
    }
});