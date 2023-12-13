import {AgentDetails} from "./types.ts";
import {AtpSessionData, AtpSessionEvent, BskyAgent} from "@atproto/api";
import {debugLog} from "./logging-utils.ts";

export function createAgent(agentDetails: AgentDetails): AgentDetails{
    agentDetails.agent = new BskyAgent({
        service: 'https://bsky.social/',
        persistSession: (evt: AtpSessionEvent, sess?: AtpSessionData) => {
            agentDetails.did = sess?.did
            agentDetails.sessionData = sess;
        },
    });
    return agentDetails;
}

export async function authenticateAgent(agentDetails: AgentDetails): Promise<AgentDetails> {
    await agentDetails.agent.login({identifier: agentDetails.handle, password: agentDetails.password})
    if (!agentDetails.sessionData) {
        throw new Error('Could not retrieve bluesky session data for reply bot')
    } else {
        debugLog('AGENT', `${agentDetails.name} is authenticated!`)
        // console.log()
    }
    await agentDetails.agent.resumeSession(agentDetails.sessionData)
    return agentDetails;
}