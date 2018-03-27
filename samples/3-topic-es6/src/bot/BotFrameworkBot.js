const restify = require('restify');
const { ConversationState, UserState, MemoryStorage, BotContext, BotFrameworkAdapter } = require('botbuilder');
const { StateBotContext } = require('./StateBotContext');

class BotFrameworkBot {
    constructor() {

        this.conversationState = new ConversationState(new MemoryStorage());
        this.userState = new UserState(new MemoryStorage());
    
        this.server = restify.createServer();
    
        this.adapter = new BotFrameworkAdapter()
            .use(this.conversationState)
            .use(this.userState);
    }

    getContext(context) {
        return StateBotContext.from(context, this.conversationState, this.userState)
    }

    do(handler) {
        return (context) => this.getContext(context).then(appContext => handler(appContext));
    }

    onReceiveActivity(handler) {
        this.server.listen(process.env.port || process.env.PORT || 3978, () => {
            console.log(`${ this.server.name } listening to ${ this.server.url }`);
        });

        this.server.post('/api/messages', (req, res) => {
            this.adapter.processRequest(req, res, this.do(handler));
        });

        return Promise.resolve();
    }
}

module.exports = {
    BotFrameworkBot
};