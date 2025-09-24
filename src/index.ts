import {Op} from "sequelize";
import {Post, PostAttributes, sequelize} from "./database/database-connection.ts";
import {RemindMeHandler, SilentRemindMeHandler} from "./handlers/RemindMeHandler.ts";
import {
    BadBotHandler,
    DebugLog,
    GoodBotHandler,
    HandlerAgent,
    JetstreamSubscription,
    JetstreamReply
} from "bsky-event-handlers";
import {generateReplyFromPostDetails, PostDetails} from "./utils/legacy-utils.ts"
import {dbClient} from "./database";


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
            new SilentRemindMeHandler(remindBotHandlerAgent),
            GoodBotHandler.make(remindBotHandlerAgent),
            BadBotHandler.make(remindBotHandlerAgent)
        ]
    },
}

async function initialize() {

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
        let postsToRemind = await dbClient.getPostsToRemind();
        if (postsToRemind.length > 0) {
            DebugLog.warn('REMIND', `Found ${postsToRemind.length} posts to remind`)
        } else {
            DebugLog.log('REMIND', `Found ${postsToRemind.length} posts to remind`, 'debug')
        }
        const remindedPosts = []
        for(const postToRemind of postsToRemind){
            if(postToRemind.silent){
                try{
                    await remindBotHandlerAgent.sendMessageToUser(postToRemind.did!, "⏰ This is your reminder! ⏰", {
                        cid: postToRemind.cid,
                        uri: postToRemind.uri,
                    })
                    DebugLog.info("REMIND", "Sent DM")
                    remindedPosts.push(postToRemind)
                }catch(e: any){
                    DebugLog.error("REMIND", `Failed to send DM: ${postToRemind.id}`)
                    DebugLog.error("REMIND", e?.message)
                }

            }else{
                if (postToRemind.reply !== null) {
                    try{
                        await remindBotHandlerAgent.createSkeet("⏰ This is your reminder! ⏰", <JetstreamReply>postToRemind.reply)
                        DebugLog.info("REMIND", "Replied to post")
                        remindedPosts.push(postToRemind)
                    }catch(e: any){
                        DebugLog.error("REMIND", `Failed to Reply to post: ${postToRemind.id}`)
                        DebugLog.error("REMIND", e?.message)
                    }

                } else {
                    try{
                        if (postToRemind.postDetails !== null) {
                            DebugLog.info("REMIND", "With post details")
                            const reply: JetstreamReply = generateReplyFromPostDetails(<PostDetails>postToRemind.postDetails)
                            await remindBotHandlerAgent.createSkeet("⏰ This is your reminder! ⏰", <JetstreamReply>reply)
                            remindedPosts.push(postToRemind)
                        } else {
                            DebugLog.error("REMIND", "No reply or Post Details")

                        }
                    }catch(e: any){
                        DebugLog.error("REMIND", `Failed to Reply to post: ${postToRemind.id}`)
                        DebugLog.error("REMIND", e?.message)
                    }

                }
            }

        }
        await dbClient.updateRemindedPosts(remindedPosts)

    }
}, 60 * interval)
