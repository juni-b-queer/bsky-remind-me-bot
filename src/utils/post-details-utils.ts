import {PostDetails} from "./types.ts";

export function getPosterDID(postDetails: PostDetails){
    return (postDetails.uri.match(/did:[^\/]*/) || [])[0];
}