import {BskyAgent, RichText} from "@atproto/api";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";
import {PostDetails} from "../../types.ts";
import {BEE_MOVIE_SKEETS} from "./bee-movie-skeets.ts";
import {PostHandler} from "../abstract-handler.ts";
import {validatorInputIs} from "../trigger-validator-functions.ts";

export let BeeMovieScriptHandler = new PostHandler(
    '!showmethebee',
    validatorInputIs,
    replyWithBeeMovieScript,
    false
)

export async function replyWithBeeMovieScript(agent: BskyAgent, op: RepoOp, postDetails: PostDetails) {
    let lastPost = postDetails;
    for (const skeetText of BEE_MOVIE_SKEETS) {
            lastPost = await recursiveReplyToPost(agent, lastPost, skeetText)
            console.log(lastPost)
            await Bun.sleep(50)
    }

}


export async function recursiveReplyToPost(agent: BskyAgent, currentPost: PostDetails, replyTextInput: string): Promise<PostDetails> {
    const replyText = new RichText({
        text: replyTextInput,
    })

    let reply = {
        root: {
            cid: currentPost.cid,
            uri: currentPost.uri
        },
        parent: {
            cid: currentPost.cid,
            uri: currentPost.uri
        }
    }

    if(currentPost.value.reply){
        reply.root = currentPost.value.reply.root
    }

    let newPost = await agent.post({
        reply: reply,
        text: replyText.text
    });


    return {
        cid: newPost.cid,
        uri: newPost.uri,
        value: {
            reply: reply
        }
    }
}
