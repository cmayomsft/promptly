import { Bot, MemoryStorage, BotStateManager } from 'botbuilder';
import { BotFrameworkAdapter } from 'botbuilder-services';
import * as restify from 'restify';

// Create server
let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log(`${server.name} listening to ${server.url}`);
});

// Create adapter
const adapter = new BotFrameworkAdapter({ appId: process.env.MICROSOFT_APP_ID, appPassword: process.env.MICROSOFT_APP_PASSWORD });
server.post('/api/messages', adapter.listen() as any);

// Initialize bot
const bot = new Bot(adapter)
    .use(new MemoryStorage())
    .use(new BotStateManager())
    .onReceive(context => {
        if (context.request.type === 'message' && context.request.text.length > 0) {
            // If bot doesn't have state it needs, prompt for it.
            if (!context.state.user.name) {
                // On the first turn, prompt and update state that conversation is in a prompt.
                if (context.state.conversation.prompt !== "name") {
                    context.state.conversation.prompt = "name";
                    context.reply("What is your name?");
                // On the subsequent turn, update state with reply and update state that prompt has completed. 
                } else {
                    delete context.state.conversation.prompt;
                    context.state.user.name = context.request.text;
                    context.reply(`Great, I'll call you ${ context.state.user.name }!`);
                }
            } else {
                context.reply(`${ context.state.user.name } said: '${ context.request.text }.'`);
            }
        }
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
