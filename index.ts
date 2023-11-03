import {AppBskyFeedPost, AtpSessionData, AtpSessionEvent, BskyAgent, RichText} from "@atproto/api";
import {ComAtprotoSyncSubscribeRepos, subscribeRepos, SubscribeReposMessage,} from 'atproto-firehose'
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";


let savedSessionData: AtpSessionData | undefined;
const BSKY_HANDLE: string = <string>Bun.env.BSKY_HANDLE
const BSKY_PASSWORD: string = <string>Bun.env.BSKY_PASSWORD
let BOT_DID: string | undefined;

const REPLIES = [
    'nobody asked',
    'no one cares',
    'who cares',
    'you\'re wrong',
    'delete ur account',
    'stfu',
    'go touch grass',
    'no one knows what you\'re talking about',
    'you need to stop'
]

const agent = new BskyAgent({
    service: 'https://bsky.social/',
    persistSession: (evt: AtpSessionEvent, sess?: AtpSessionData) => {
        BOT_DID = sess?.did
        savedSessionData = sess;
    },
})
const firehoseClient = subscribeRepos(`wss://bsky.social`, { decodeRepoOps: true })

async function initialize(){
    await agent.login({identifier: BSKY_HANDLE, password: BSKY_PASSWORD})
    await agent.resumeSession(savedSessionData)
}

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

async function findPostDetails(op: RepoOp, repo: string){
    let rkey = op.path.split('/')[1]
    return await agent.getPost({
        repo: repo, rkey: rkey
    });
}

async function handlePayload(op: RepoOp, repo: string){

    let payload = op.payload;

    let currentPost = await findPostDetails(op, repo);

    const replyText = new RichText({
        text: `Well actually ${REPLIES[Math.floor(Math.random() * (REPLIES.length - 1))]}`,
    })
    return await agent.post({
        reply: {
            root: payload.reply.root,
            parent: {
                cid: currentPost.cid,
                uri: currentPost.uri
            }
        },
        text: replyText.text
    });
}

await initialize();

firehoseClient.on('message', (m: SubscribeReposMessage) => {
    if (ComAtprotoSyncSubscribeRepos.isCommit(m)) {
        m.ops.forEach((op) => {
            let payload = op.payload;
            switch (payload?.$type){
                case 'app.bsky.feed.post':
                    if(AppBskyFeedPost.isRecord(payload)){
                        if(payload.reply){
                            payloadTrigger(op, m.repo).then(async (resp) => {
                                if (resp) {
                                    console.log('will respond')
                                    let handle = await handlePayload(op, m.repo)
                                    console.log(handle)
                                }
                            })
                        }
                    }
            }
        })
    }
})




