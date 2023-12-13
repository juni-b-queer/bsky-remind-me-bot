import {AppBskyFeedPost, AtpSessionData, BskyAgent} from "@atproto/api";
import {RepoOp} from "@atproto/api/dist/client/types/com/atproto/sync/subscribeRepos";

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

export type ValidatorInput = {
    op: RepoOp,
    repo: string,
    agent: BskyAgent
}