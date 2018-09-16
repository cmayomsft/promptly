const restify = require('restify');
const { UserState, ConversationState, BotFrameworkAdapter, MemoryStorage } = require('botbuilder');

// Create server
let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log(`${server.name} listening to ${server.url}`);
});

// Create adapter
const adapter = new BotFrameworkAdapter( { 
    appId: process.env.MICROSOFT_APP_ID, 
    appPassword: process.env.MICROSOFT_APP_PASSWORD 
});

// Add state middleware
const conversationState = new ConversationState(new MemoryStorage());
const userState = new UserState(new MemoryStorage());

adapter
    .use(userState)
    .use(conversationState)

// Listen for incoming requests 
server.post('/api/messages', (req, res) => {
    // Route received request to adapter for processing
    adapter.processRequest(req, res, async (context) => {
        if (context.request.type === 'message' && context.request.text.length > 0) {
            // If bot doesn't have state it needs, prompt for it.
            if (!userState.get(context).name) {
                // On the first turn, prompt and update state that conversation is in a prompt.
                if (conversationState.get(context).prompt !== "name") {
                    conversationState.get(context).prompt = "name";
                    await context.sendActivity("What is your name?");
                // On the subsequent turn, update state with reply and update state that prompt has completed. 
                } else {
                    conversationState.get(context).prompt = undefined;
                    userState.get(context).name = context.request.text;
                    await context.sendActivity(`Great, I'll call you '${ userState.get(context).name }'!`);
                }
            } else {
                await context.sendActivity(`${ userState.get(context).name } said: '${ context.request.text }.'`);
            }
        }
    });
});




            /*
            if (!context.state.user.name) {
                if (context.state.conversation.prompt !== "name") {
                    context.state.conversation.prompt = "name";
                    context.reply("What is your name?");
                } else {
                    delete context.state.conversation.prompt;
                    context.state.user.name = context.request.text;
                    context.reply(`Great, I'll call you ${ context.state.user.name }!`);
                }
            } else {
                context.reply(`${ context.state.user.name } said: '${ context.request.text }.'`);
            }
            */
