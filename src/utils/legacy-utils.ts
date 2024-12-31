import {AppBskyFeedPost} from "@atproto/api";
import {JetstreamReply} from "bsky-event-handlers";

export type PostDetails = {
    uri: string;
    cid: string;
    value: AppBskyFeedPost.Record | object;
};

export function generateReplyFromPostDetails(
    currentPost: PostDetails,
): JetstreamReply {
    const reply = {
        root: {
            cid: currentPost.cid,
            uri: currentPost.uri,
        },
        parent: {
            cid: currentPost.cid,
            uri: currentPost.uri,
        },
    };

    // @ts-ignore
    if (currentPost.value.reply) {
        // @ts-ignore
        reply.root = currentPost.value.reply.root;
    }

    return reply;
}
