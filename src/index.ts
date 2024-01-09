import {AppBskyFeedPost} from "@atproto/api";
import {
    ComAtprotoSyncSubscribeRepos,
    subscribeRepos,
    SubscribeReposMessage,
    XrpcEventStreamClient,
} from 'atproto-firehose'
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {Model, Op} from "sequelize";
import {Post, sequelize} from "./database/database-connection.ts";
import {RemindMeHandler} from "./handlers/RemindMeHandler.ts";
import {
    HandlerController,
    AgentDetails,
    PostDetails,
    replyToPost,
    authenticateAgent,
    createAgent,
    debugLog
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

let remindBotHandlerController: HandlerController;
let lastMessage = Date.now()

/**
 * Agent for reminders
 */
remindBotAgentDetails = createAgent(remindBotAgentDetails)

async function authorizeDatabase() {
    try {
        await sequelize.authenticate();
        debugLog("INIT", 'Connection to Database has been established successfully.')
        // console.log('Connection to Database has been established successfully.');
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

    // Here is where we're initializing the handler functions
    remindBotAgentDetails = await authenticateAgent(remindBotAgentDetails)
    if (!remindBotAgentDetails.agent) {
        throw new Error(`Could not get agent from ${remindBotAgentDetails.name}`)
    } else {
        remindBotHandlerController = new HandlerController(remindBotAgentDetails, [
            RemindMeHandler,
            GoodBotHandler,
            BadBotHandler
            // TestHandler
        ])
    }
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
let firehoseClient = subscribeRepos(`wss://bsky.network`, {decodeRepoOps: true})

setFirehoseListener(firehoseClient)

function setFirehoseListener(firehoseClient: XrpcEventStreamClient) {
    firehoseClient.on('message', (m: SubscribeReposMessage) => {
        if (ComAtprotoSyncSubscribeRepos.isCommit(m)) {
            m.ops.forEach((op: RepoOp) => {
                // console.log(op)
                let payload = op.payload;
                lastMessage = Date.now()
                // @ts-ignore
                switch (payload?.$type) {
                    case 'app.bsky.feed.post':
                        if (AppBskyFeedPost.isRecord(payload)) {
                            let repo = m.repo;
                            if (payload.reply) {
                                remindBotHandlerController.handle(op, repo)
                            }
                        }
                }
            })
        }
    })
}


let interval = 100
let MAX_TIME_BETWEEN = 100;
let countSinceReminders = 0;
setInterval(async function () {
    // console.log("Checking for posts to remind");
    countSinceReminders++;
    if(countSinceReminders == 5){
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
        countSinceReminders = 0;
    }


    let currentTime = Date.now();
    let diff = currentTime - lastMessage;
    debugLog('SCHEDULE', `Time since last received message: ${diff}`)
    // console.log(`Time since last received message: ${diff}`)
    if (diff > MAX_TIME_BETWEEN) {
        debugLog('SUBSCRIPTION', 'Restarting subscription')
        // console.log('Restarting subscription')
        firehoseClient.removeAllListeners();
        firehoseClient = subscribeRepos(`wss://bsky.network`, {decodeRepoOps: true})
        setFirehoseListener(firehoseClient)
        debugLog('SUBSCRIPTION', 'Subscription Restarted')
        // console.log('Subscription Restarted')
    }

}, 60 * interval)
