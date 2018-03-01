import * as restify from 'restify';
import { Bot, MemoryStorage, BotStateManager } from 'botbuilder';
import { BotFrameworkAdapter } from 'botbuilder-services';
import { RootTopic } from './topics/rootTopic';

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
    .onReceive((context) => {
        // State isn't fully initialized until the contact/conversation messages are sent, so have to require
        //  activity type is message. Will affect welcome message. Refactor after bug has been addressed.
        if(context.request.type === 'message') {
            return new RootTopic(context)
                .onReceive(context);
        }
    });