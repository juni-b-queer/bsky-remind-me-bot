import {AppBskyFeedPost, AtpSessionData, AtpSessionEvent, BskyAgent} from "@atproto/api";
import {
    ComAtprotoSyncSubscribeRepos,
    subscribeRepos,
    SubscribeReposMessage,
    XrpcEventStreamClient,
} from 'atproto-firehose'
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {HandlerController} from "./handlers/abstract-handler.ts";
import {Op} from "sequelize";
import {Post, sequelize} from "./database/database-connection.ts";
import {RemindMeHandler} from "./handlers/remind-me/remind-me-handler.ts";
import {AgentDetails, PostDetails} from "./utils/types.ts";
import {replyToPost} from "./utils/agent-post-functions.ts";
import {authenticateAgent, createAgent} from "./utils/agent-utils.ts";

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

async function authorizeDatabase(){
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        await Post.sync({alter: true})
        return true;
    } catch (error) {
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
    if(!remindBotAgentDetails.agent){
        throw new Error(`Could not get agent from ${remindBotAgentDetails.name}`)
    }else{
        remindBotHandlerController = new HandlerController(remindBotAgentDetails.agent, [
            RemindMeHandler
        ])
    }



    console.log("Initialized!")
}

try{
    await initialize();
}catch (e) {
    setTimeout(async function(){
        await initialize()
    }, 30000)
}



/**
 * The client and listener for the firehose
 */
let firehoseClient = subscribeRepos(`wss://bsky.network`, {decodeRepoOps: true})

setFirehoseListener(firehoseClient)

function setFirehoseListener(firehoseClient: XrpcEventStreamClient){
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




let interval  = 500
let MAX_TIME_BETWEEN = 100;
setInterval(async function () {
    console.log("Checking for posts to remind");
    if(remindBotAgentDetails.agent){
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
        for (let post of postsToRemind){
            try{
                console.log(<PostDetails>post.postDetails);
                await replyToPost(remindBotAgentDetails.agent, <PostDetails>post.postDetails, "⏰ This is your reminder! ⏰")
            }catch (e) {
                console.log(e)
            }
            post.repliedAt = new Date()
            post.save()
        }
    }

    console.log("Checking if firehose is connected")
    let currentTime = Date.now();
    let diff = currentTime - lastMessage;
    console.log(`Time since last received message: ${diff}`)
    if(diff > MAX_TIME_BETWEEN){
        console.log('Restarting subscription')
        firehoseClient.removeAllListeners();
        firehoseClient = subscribeRepos(`wss://bsky.network`, {decodeRepoOps: true})
        setFirehoseListener(firehoseClient)
    }

}, 60 * interval)
