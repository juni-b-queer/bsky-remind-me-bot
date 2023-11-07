import {AppBskyFeedPost, AtpSessionData, AtpSessionEvent, BskyAgent, RichText} from "@atproto/api";
import {ComAtprotoSyncSubscribeRepos, subscribeRepos, SubscribeReposMessage,} from 'atproto-firehose'
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {HandlerController, PostHandler} from "./handlers/abstract-handler.ts";
import {validatorInputContains, validatorInputStartsWith} from "./handlers/trigger-validator-functions.ts";
import {replyToSixtyNine, replyToWellActually} from "./handlers/trigger-action-functions.ts";

let savedSessionData: AtpSessionData | undefined;
const BSKY_HANDLE: string = <string>Bun.env.BSKY_HANDLE
const BSKY_PASSWORD: string = <string>Bun.env.BSKY_PASSWORD
let BOT_DID: string | undefined;

const SEND_ONLINE_MESSAGE = false

let postHandlerController: HandlerController;
let replyHandlerController: HandlerController;

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
        let OnlinePost = await agent.post({
            text: onlineText.text
        });
    }
    // Here is where we're initializing the handler functions
    postHandlerController = new HandlerController([
        new PostHandler(agent,
            ' 69 ',
            validatorInputContains,
            replyToSixtyNine
        )
    ])

    replyHandlerController = new HandlerController([
        new PostHandler(agent,
            'wellactually',
            validatorInputStartsWith,
            replyToWellActually
        ),
        new PostHandler(agent,
            ' 69 ',
            validatorInputContains,
            replyToSixtyNine
        )
    ])
    console.log("Agent Authenticated!")
}

await initialize();


/**
 * The client and listener for the firehose
 */
const firehoseClient = subscribeRepos(`wss://bsky.social`, {decodeRepoOps: true})
firehoseClient.on('message', (m: SubscribeReposMessage) => {
    if (ComAtprotoSyncSubscribeRepos.isCommit(m)) {
        m.ops.forEach((op: RepoOp) => {
            let payload = op.payload;
            // @ts-ignore
            switch (payload?.$type) {
                case 'app.bsky.feed.post':
                    if (AppBskyFeedPost.isRecord(payload)) {
                        if (payload.reply) {
                            replyHandlerController.handle(op, m.repo)
                        }else{
                            postHandlerController.handle(op, m.repo)
                        }
                    }
            }
        })
    }
})


