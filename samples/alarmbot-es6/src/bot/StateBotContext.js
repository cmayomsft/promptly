const { Activity, BotContext, ConversationState, UserState } = require('botbuilder');

class StateBotContext extends BotContext {
    // Instead of adding things here, add them in `from()`
    constructor(context) {
        super(context);
    }

    // "from" adds any properties or methods that depend on arguments or async calls or both
    // think of it as an async constructor
    static async from(context, conversationState, userState) {
        const stateContext = new StateBotContext(context);

        stateContext.conversationState = await conversationState.read(context);
        stateContext.userState = await userState.read(context);

        return stateContext;
    }
}

module.exports = {
    StateBotContext
};