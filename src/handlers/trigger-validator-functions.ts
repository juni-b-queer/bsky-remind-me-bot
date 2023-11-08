import {flattenTextUpdated} from "../text-utils.ts";

/**
 * Returns a boolean for if the skeet should trigger a response
 */
export function validatorInputStartsWith(triggerKey: string, input: string) {
    // @ts-ignore
    const flatText = flattenTextUpdated(triggerKey, input)

    return flatText.startsWith(triggerKey)
}

export function validatorInputContains(triggerKey: string, input: string) {
    // @ts-ignore
    const flatText = flattenTextUpdated(triggerKey, input)

    return flatText.includes(triggerKey);
}

export function validatorInputIs(triggerKey: string, input: string) {
    return input === triggerKey;
}