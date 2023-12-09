import {AppBskyFeedPost, AtpSessionData, BskyAgent} from "@atproto/api";

export type PostDetails = {
    uri: string,
    cid: string,
    value: AppBskyFeedPost.Record | object
}

export type AgentDetails = {
    name: string,
    handle: string,
    password: string,
    did: string|undefined,
    sessionData: AtpSessionData|undefined,
    agent: BskyAgent|undefined
}