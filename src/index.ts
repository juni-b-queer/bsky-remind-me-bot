import {Op} from "sequelize";
import {Post, PostAttributes, sequelize} from "./database/database-connection.ts";
import {RemindMeHandler} from "./handlers/RemindMeHandler.ts";
import {
    BadBotHandler,
    DebugLog,
    debugLog,
    GoodBotHandler,
    HandlerAgent,
    JetstreamSubscription,
    Reply
} from "bsky-event-handlers";
import {PostDetails, replyToPost} from "./utils/legacy-utils.ts"


const remindBotHandlerAgent = new HandlerAgent(
    "remind-bot",
    <string>Bun.env.REMIND_BOT_BSKY_HANDLE,
    <string>Bun.env.REMIND_BOT_BSKY_PASSWORD,
);

let jetstreamSubscription: JetstreamSubscription;


let handlers = {
    post: {
        c: [
            new RemindMeHandler(remindBotHandlerAgent),
            new GoodBotHandler(remindBotHandlerAgent),
            new BadBotHandler(remindBotHandlerAgent)
        ]
    },
}

async function authorizeDatabase() {
    try {
        await sequelize.authenticate();
        DebugLog.warn("INIT", 'Connection to Database has been established successfully.')
        await Post.sync({alter: true})
        return true;
    } catch (error) {
        DebugLog.error("INIT", 'Connection to Database FAILED.')
        console.error('Unable to connect to the database:', error);
        await setTimeout(async () => {
            await authorizeDatabase()
        }, 10000)
        return false;
    }
}

async function initialize() {
    await authorizeDatabase();

    await remindBotHandlerAgent.authenticate()

    DebugLog.info("INIT", 'Initialized!')

    jetstreamSubscription = new JetstreamSubscription(
        handlers,
        <string>Bun.env.JETSTREAM_URL
    );
}

initialize().then(() => {
    jetstreamSubscription.createSubscription()
});


let interval = 500;
setInterval(async function () {
    if (remindBotHandlerAgent.getAgent) {
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
        if (postsToRemind.length > 0) {
            debugLog('REMIND', `Found ${postsToRemind.length} posts to remind`, 'warn')
        } else {
            debugLog('REMIND', `Found ${postsToRemind.length} posts to remind`, 'info')
        }
        // console.log(`Found ${postsToRemind.length} posts to remind`)
        // @ts-ignore
        for (let postModel: PostAttributes of postsToRemind) {
            let post: PostAttributes = <PostAttributes><unknown>postModel;
            try {
                // @ts-ignore
                DebugLog.warn('REMIND', `Reminding post cid: ${post.cid}`)
                // console.log(`Reminding post cid: ${post.cid}`)
                if (post.reply !== null) {
                    await remindBotHandlerAgent.createSkeet("⏰ This is your reminder! ⏰", <Reply>post.reply)

                } else {
                    if (post.postDetails !== null) {
                        // @ts-ignore
                        await replyToPost(remindBotHandlerAgent.getAgent, <PostDetails>post.postDetails, "⏰ This is your reminder! ⏰")
                    } else {
                        DebugLog.error("REMIND", "No reply or Post Details")
                    }
                }

            } catch (e) {
                DebugLog.error('REMIND', `Failed to remind post`)
            }
            // @ts-ignore
            postModel.repliedAt = new Date()
            postModel.save()
        }
    }
}, 60 * interval)
