import {Op} from "sequelize";
import {Post, sequelize} from "./database/database-connection.ts";
import {RemindMeHandler} from "./handlers/RemindMeHandler.ts";
import {
    HandlerController,
    AgentDetails,
    PostDetails,
    replyToPost,
    authenticateAgent,
    createAgent,
    debugLog, FirehoseSubscription
} from "bsky-event-handlers";
import {TestHandler} from "./handlers/TestHandler.ts";
import {GoodBotHandler} from "./handlers/GoodBotHandler.ts";
import {BadBotHandler} from "./handlers/BadBotHandler.ts";

let remindBotAgentDetails: AgentDetails = {
    name: "remind-bot",
    did: undefined,
    handle: <string>Bun.env.REMIND_BOT_BSKY_HANDLE,
    password: <string>Bun.env.REMIND_BOT_BSKY_PASSWORD,
    sessionData: undefined,
    agent: undefined
}
/**
 * Create the agent in the agent details
 */
remindBotAgentDetails = createAgent(remindBotAgentDetails)

/**
 * HandlerController for the Remind Bot.
 * This class is responsible for handling incoming requests and coordinating the different handlers for Remind Bot functionalities.
 *
 * @class
 */
let remindBotHandlerController: HandlerController;

async function authorizeDatabase() {
    try {
        await sequelize.authenticate();
        debugLog("INIT", 'Connection to Database has been established successfully.')
        await Post.sync({alter: true})
        return true;
    } catch (error) {
        debugLog("INIT", 'Connection to Database FAILED.', true)
        console.error('Unable to connect to the database:', error);
        await setTimeout(async () => {
            await authorizeDatabase()
        }, 10000)
        return false;
    }
}

async function initialize() {
    await authorizeDatabase();

    remindBotAgentDetails = await authenticateAgent(remindBotAgentDetails)

    remindBotHandlerController = new HandlerController(remindBotAgentDetails, [
        RemindMeHandler,
        GoodBotHandler,
        BadBotHandler
        // TestHandler
    ], true)

    debugLog("INIT", 'Initialized!')
}

try {
    await initialize();
} catch (e) {
    setTimeout(async function () {
        await initialize()
    }, 30000)
}


/**
 * The client and listener for the firehose
 */
const firehoseSubscription = new FirehoseSubscription(
    [remindBotHandlerController],
    150
);



let interval = 500;
setInterval(async function () {
    if (remindBotAgentDetails.agent) {
        // Check for posts that require reminding
        let postsToRemind = await Post.findAll({
            where: {
                [Op.and]: [
                    {
                        repliedAt: {
                            [Op.is]: null
                        },
                    },
                    {
                        reminderDate: {
                            [Op.lte]: new Date()
                        }
                    }
                ],
            }
        });
        debugLog('REMIND', `Found ${postsToRemind.length} posts to remind`)
        // console.log(`Found ${postsToRemind.length} posts to remind`)
        for (let post: Post of postsToRemind) {
            try {
                debugLog('REMIND', `Reminding post cid: ${post.cid}`)
                // console.log(`Reminding post cid: ${post.cid}`)
                await replyToPost(remindBotAgentDetails.agent, <PostDetails>post.postDetails, "⏰ This is your reminder! ⏰")
            } catch (e) {
                debugLog('REMIND', `Failed to remind post`, true)
            }
            post.repliedAt = new Date()
            post.save()
        }
    }
}, 60 * interval)
