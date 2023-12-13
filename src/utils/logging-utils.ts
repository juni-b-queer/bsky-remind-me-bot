import { nowDateTime} from "./time-utils.ts";

const debug = true;
export function debugLog(action: string, message: string, error: boolean = false){
    if(debug){
        console.log(`${nowDateTime()} | ${action} |${error ? " ERROR |" : ""} ${message}`)
    }
}