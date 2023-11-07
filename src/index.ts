import {AppBskyFeedPost, AtpSessionData, AtpSessionEvent, BskyAgent, RichText} from "@atproto/api";
import {ComAtprotoSyncSubscribeRepos, subscribeRepos, SubscribeReposMessage,} from 'atproto-firehose'
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {REPLIES} from "./bot-replies.ts"
import {containsNumbers, containsPunctuation, flattenText} from "./text-utils.ts";
import {PostDetails} from "./types.ts";

let savedSessionData: AtpSessionData | undefined;
const BSKY_HANDLE: string = <string>Bun.env.BSKY_HANDLE
const BSKY_PASSWORD: string = <string>Bun.env.BSKY_PASSWORD
let BOT_DID: string | undefined;

const SEND_ONLINE_MESSAGE = false

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

    console.log("Agent Authenticated!")
}

await initialize();


/**
 * Payload handler functions
 */
async function postReplyHandler(op: RepoOp, repo: string){
    // When payload starts with wellactually
    payloadTriggerStartsWith(op, repo, 'wellactually').then((postDetails: false | PostDetails) => {
        if (postDetails) {
            let inputText = `well actually ${REPLIES[Math.floor(Math.random() * (REPLIES.length - 1))]}`;
            handleReplyPayloadWithReply(op, postDetails, inputText)
        }
    })

    payloadTriggerContains(op, repo, ' 69 ', true).then((postDetails: false | PostDetails) => {
        if (postDetails) {
            let inputText = `Nice.`;
            handleReplyPayloadWithReply(op, postDetails, inputText)
        }
    })
}

async function postHandler(op: RepoOp, repo: string){
    // When Post contains '69'
    payloadTriggerContains(op, repo, ' 69 ', true).then((postDetails: false | PostDetails) => {
        if (postDetails) {
            let inputText = `Nice.`;
            handlePostPayloadWithReply(op, postDetails, inputText)
        }
    })
}

/**
 * The client and listener for the firehose
 */
const firehoseClient = subscribeRepos(`wss://bsky.social`, {decodeRepoOps: true})
firehoseClient.on('message', (m: SubscribeReposMessage) => {
    if (ComAtprotoSyncSubscribeRepos.isCommit(m)) {
        m.ops.forEach((op) => {
            let payload = op.payload;
            // @ts-ignore
            switch (payload?.$type) {
                case 'app.bsky.feed.post':
                    if (AppBskyFeedPost.isRecord(payload)) {
                        if (payload.reply) {
                            postReplyHandler(op, m.repo).then(() =>{

                            })
                        }else{
                            postHandler(op, m.repo).then(() =>{

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
async function payloadTriggerStartsWith(op: RepoOp, repo: string, startsWithInput: string, exactMatch: boolean = false) {
    // @ts-ignore
    const flatText = exactMatch ? op.payload.text : flattenText(op.payload.text, containsNumbers(startsWithInput), containsPunctuation(startsWithInput))

    let doesStartWith = flatText.startsWith(startsWithInput);
    if (!doesStartWith) {
        return false;
    }
    let postDetails = await findPostDetails(op, repo);
    let postDid = postDetails.uri.split('/')[2];
    let postedByBot = postDid === BOT_DID;
    return (doesStartWith && !postedByBot) ? postDetails : false;
}

async function payloadTriggerContains(op: RepoOp, repo: string, containsInput: string, exactMatch: boolean = false) {
    // @ts-ignore
    const flatText = exactMatch ? op.payload.text : flattenText(op.payload.text, containsNumbers(containsInput), containsPunctuation(containsInput))

    let doesContain = flatText.includes(containsInput);
    if (!doesContain) {
        return false;
    }
    let postDetails = await findPostDetails(op, repo);
    let postDid = postDetails.uri.split('/')[2];
    let postedByBot = postDid === BOT_DID;
    return (doesContain && !postedByBot) ? postDetails : false;
}


/**
 * Replies to the skeet
 */
async function handleReplyPayloadWithReply(op: RepoOp, currentPost: PostDetails, replyTextInput: string) {
    const replyText = new RichText({
        text: replyTextInput,
    })

    let newPost = await agent.post({
        reply: {
            // @ts-ignore
            root: op.payload.reply.root,
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

async function handlePostPayloadWithReply(op: RepoOp, currentPost: PostDetails, replyTextInput: string) {
    const replyText = new RichText({
        text: replyTextInput,
    })

    let newPost = await agent.post({
        reply: {
            // @ts-ignore
            root: {
                cid: currentPost.cid,
                uri: currentPost.uri
            },
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
async function findPostDetails(op: RepoOp, repo: string): Promise<PostDetails> {
    let rkey = op.path.split('/')[1]
    return await agent.getPost({
        repo: repo, rkey: rkey
    });
}


