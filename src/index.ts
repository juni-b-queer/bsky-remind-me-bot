import {AppBskyFeedPost, AtpSessionData, AtpSessionEvent, BskyAgent} from "@atproto/api";
import {ComAtprotoSyncSubscribeRepos, subscribeRepos, SubscribeReposMessage,} from 'atproto-firehose'
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {HandlerController} from "./handlers/abstract-handler.ts";
import {WellActuallyHandler} from "./handlers/well-actually/well-actually-handler.ts";
import {SixtyNineHandler} from "./handlers/sixty-nine/sixty-nine-handler.ts";
import {BeeMovieScriptHandler} from "./handlers/bee-movie/bee-movie-script-handler.ts";
import {Op} from "sequelize";
import {Post, sequelize} from "./database/database-connection.ts";
import {RemindMeHandler} from "./handlers/remind-me/remind-me-handler.ts";
import {AgentDetails, PostDetails} from "./utils/types.ts";
import {replyToPost} from "./utils/agent-post-functions.ts";
import {authenticateAgent, createAgent} from "./utils/agent-utils.ts";

// let replyBotSavedSessionData: AtpSessionData | undefined;
// const REPLY_BOT_BSKY_HANDLE: string = <string>Bun.env.REPLY_BOT_BSKY_HANDLE
// const REPLY_BOT_BSKY_PASSWORD: string = <string>Bun.env.REPLY_BOT_BSKY_PASSWORD
// let REPLY_BOT_DID: string | undefined;

let replyBotAgentDetails: AgentDetails = {
    name: "reply-bot",
    did: undefined,
    handle: <string>Bun.env.REPLY_BOT_BSKY_HANDLE,
    password: <string>Bun.env.REPLY_BOT_BSKY_PASSWORD,
    sessionData: undefined,
    agent: undefined
}


let remindBotSavedSessionData: AtpSessionData | undefined;
const REMIND_BOT_BSKY_HANDLE: string = <string>Bun.env.REMIND_BOT_BSKY_HANDLE
const REMIND_BOT_BSKY_PASSWORD: string = <string>Bun.env.REMIND_BOT_BSKY_PASSWORD
let REMIND_BOT_DID: string | undefined;
const SEND_ONLINE_MESSAGE = false

let remindBotAgentDetails: AgentDetails = {
    name: "remind-bot",
    did: undefined,
    handle: <string>Bun.env.REMIND_BOT_BSKY_HANDLE,
    password: <string>Bun.env.REMIND_BOT_BSKY_PASSWORD,
    sessionData: undefined,
    agent: undefined
}

let postOnlyHandlerController: HandlerController;
let replyOnlyHandlerController: HandlerController;
let allPostsHandlerController: HandlerController;

let remindBotHandlerController: HandlerController;

let testingHandlerController: HandlerController;

/**
 * Bluesky agent for taking actions (posting) on bluesky
 */
replyBotAgentDetails = createAgent(replyBotAgentDetails);

/**
 * Agent for reminders
 */
remindBotAgentDetails = createAgent(remindBotAgentDetails)


async function initialize() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }

    replyBotAgentDetails = await authenticateAgent(replyBotAgentDetails)


    if(!replyBotAgentDetails.agent){
        throw new Error(`Could not get agent from ${replyBotAgentDetails.name}`)
    }else{
        postOnlyHandlerController = new HandlerController(replyBotAgentDetails.agent, [])

        replyOnlyHandlerController = new HandlerController(replyBotAgentDetails.agent, [
            WellActuallyHandler
        ])

        allPostsHandlerController = new HandlerController(replyBotAgentDetails.agent, [
            SixtyNineHandler,
            BeeMovieScriptHandler,
            RemindMeHandler
        ])

        testingHandlerController = new HandlerController(replyBotAgentDetails.agent, [
            // TestHandler
        ])
    }

    // Here is where we're initializing the handler functions

    remindBotAgentDetails = await authenticateAgent(remindBotAgentDetails)
    if(!remindBotAgentDetails.agent){
        throw new Error(`Could not get agent from ${replyBotAgentDetails.name}`)
    }else{
        remindBotHandlerController = new HandlerController(remindBotAgentDetails.agent, [
            RemindMeHandler
        ])
    }

    await Post.sync({alter: true})

    console.log("Initialized!")
}

await initialize();


/**
 * The client and listener for the firehose
 */
const firehoseClient = subscribeRepos(`wss://bsky.network`, {decodeRepoOps: true})
firehoseClient.on('message', (m: SubscribeReposMessage) => {
    if (ComAtprotoSyncSubscribeRepos.isCommit(m)) {
        m.ops.forEach((op: RepoOp) => {
            // console.log(op)
            let payload = op.payload;
            // @ts-ignore
            switch (payload?.$type) {
                case 'app.bsky.feed.post':
                    if (AppBskyFeedPost.isRecord(payload)) {
                        let repo = m.repo;
                        if (payload.reply) {
                            // replyOnlyHandlerController.handle(op, repo)
                        } else {
                            // testingHandlerController.handle(op, m.repo)
                            // postOnlyHandlerController.handle(op, repo)
                        }
                        // allPostsHandlerController.handle(op, repo)
                        remindBotHandlerController.handle(op, repo)

                        testingHandlerController.handle(op, repo)
                    }
            }
        })
    }
})

let inter  = 1000
setInterval(async function () {
    console.log("Checking for posts to remind");
    if(remindBotAgentDetails.agent){
        // Check for posts that require reminding
        let currentTime = new Date()
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
            console.log(<PostDetails>post.postDetails);
            await replyToPost(remindBotAgentDetails.agent, <PostDetails>post.postDetails, "This is a reminder")
            post.repliedAt = new Date()
            post.save()
        }
    }

}, 60 * inter)
