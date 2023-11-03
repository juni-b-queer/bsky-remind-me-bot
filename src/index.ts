import {AppBskyFeedPost, AtpSessionData, AtpSessionEvent, BskyAgent, RichText} from "@atproto/api";
import {ComAtprotoSyncSubscribeRepos, subscribeRepos, SubscribeReposMessage,} from 'atproto-firehose'
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {REPLIES} from "./util/bot-replies.ts";


let savedSessionData: AtpSessionData | undefined;
const BSKY_HANDLE: string = <string>Bun.env.BSKY_HANDLE
const BSKY_PASSWORD: string = <string>Bun.env.BSKY_PASSWORD
let BOT_DID: string | undefined;

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

async function initialize(){
    await agent.login({identifier: BSKY_HANDLE, password: BSKY_PASSWORD})
    if (!savedSessionData) {
        throw new Error('Could not retrieve bluesky session data')
    }
    await agent.resumeSession(savedSessionData)
}

await initialize();

/**
 * The client and listener for the firehose
 */
const firehoseClient = subscribeRepos(`wss://bsky.social`, { decodeRepoOps: true })
firehoseClient.on('message', (m: SubscribeReposMessage) => {
    if (ComAtprotoSyncSubscribeRepos.isCommit(m)) {
        m.ops.forEach((op) => {
            let payload = op.payload;
            switch (payload?.$type){
                case 'app.bsky.feed.post':
                    if(AppBskyFeedPost.isRecord(payload)){
                        if(payload.reply){
                            payloadTrigger(op, m.repo).then((shouldRespond) => {
                                if (shouldRespond) {
                                    handlePayload(op, m.repo)
                                }
                            })
                        }
                    }
            }
        })
    }
})

/**
 * Returns a boolean for if the skeet should trigger a response
 */
async function payloadTrigger(op: RepoOp, repo: string) {
    const flatText = op.payload.text.toLowerCase().replaceAll(" ", "")

    let startsWith = flatText.startsWith('wellactually') || flatText.startsWith('well,actually');
    if(!startsWith){
        return false;
    }
    let postDetails = await findPostDetails(op, repo);
    let postDid = postDetails.uri.split('/')[2];
    let postedByBot = postDid === BOT_DID;
    return startsWith && !postedByBot;
}


/**
 * Replies to the skeet
 */
async function handlePayload(op: RepoOp, repo: string){

    let payload = op.payload;

    let currentPost = await findPostDetails(op, repo);

    const replyText = new RichText({
        text: `Well actually ${REPLIES[Math.floor(Math.random() * (REPLIES.length - 1))]}`,
    })
    let newPost =  await agent.post({
        reply: {
            root: payload.reply.root,
            parent: {
                cid: currentPost.cid,
                uri: currentPost.uri
            }
        },
        text: replyText.text
    });
    console.log(newPost)
    return;
}

/**
 * Mainly used to get a skeets uri, since it's for some reason not included in the op or message
 */
async function findPostDetails(op: RepoOp, repo: string){
    let rkey = op.path.split('/')[1]
    return await agent.getPost({
        repo: repo, rkey: rkey
    });
}
