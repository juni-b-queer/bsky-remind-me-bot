import {AppBskyFeedPost, AtpSessionData, AtpSessionEvent, BskyAgent, RichText} from "@atproto/api";
import {ComAtprotoSyncSubscribeRepos, subscribeRepos, SubscribeReposMessage,} from 'atproto-firehose'
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {HandlerController} from "./handlers/abstract-handler.ts";
import {TestHandler} from "./handlers/test-handler/test-handler.ts";
import {WellActuallyHandler} from "./handlers/well-actually/well-actually-handler.ts";
import {SixtyNineHandler} from "./handlers/sixty-nine/sixty-nine-handler.ts";
import {BeeMovieScriptHandler} from "./handlers/bee-movie/bee-movie-script-handler.ts";

let savedSessionData: AtpSessionData | undefined;
const BSKY_HANDLE: string = <string>Bun.env.BSKY_HANDLE
const BSKY_PASSWORD: string = <string>Bun.env.BSKY_PASSWORD
let BOT_DID: string | undefined;

const SEND_ONLINE_MESSAGE = false

let postOnlyHandlerController: HandlerController;
let replyOnlyHandlerController: HandlerController;
let allPostsHandlerController: HandlerController;

let testingHandlerController: HandlerController;

/**
 * Bluesky agent for taking actions (posting) on bluesky
 */
const agent = new BskyAgent({
    service: 'https://bsky.social/',
    persistSession: (evt: AtpSessionEvent, sess?: AtpSessionData) => {
        BOT_DID = sess?.did
        savedSessionData = sess;
    },
})

async function initialize() {
    await agent.login({identifier: BSKY_HANDLE, password: BSKY_PASSWORD})
    if (!savedSessionData) {
        throw new Error('Could not retrieve bluesky session data')
    }
    await agent.resumeSession(savedSessionData)
    if(SEND_ONLINE_MESSAGE){
        const onlineText = new RichText({
            text: `Bot Online!`,
        });
        await agent.post({
            text: onlineText.text
        });
    }
    // Here is where we're initializing the handler functions
    postOnlyHandlerController = new HandlerController( agent, [

    ])

    replyOnlyHandlerController = new HandlerController(agent,[
        WellActuallyHandler
    ])

    allPostsHandlerController = new HandlerController( agent, [
        SixtyNineHandler,
        BeeMovieScriptHandler
    ])

    testingHandlerController = new HandlerController(agent, [
        // TestHandler
    ])

    console.log("Agent Authenticated!")
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
                            replyOnlyHandlerController.handle(op, repo)
                        }else{
                            // testingHandlerController.handle(op, m.repo)
                            postOnlyHandlerController.handle(op, repo)
                        }
                        allPostsHandlerController.handle(op, repo)

                        // testingHandlerController.handle(op, repo)
                    }
            }
        })
    }
})


