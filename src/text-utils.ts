/**
 * Flatten Text runs a number of string mutations to remove special characters, spaces, and convert it to lower case
 * @param input
 * @param alphaNumeric
 * @param keepPunctuation
 */
export function flattenText(input: string, alphaNumeric: boolean = false, keepPunctuation: boolean = false): string{
    input = keepPunctuation ? input : removePunctuation(input);
    return input
        .toLowerCase()
        .replace(alphaNumeric ? /[^a-z0-9.,\/#!$?%\^&\*;:{}=\-_`~()]/g : /[^a-zA-Z.,\/#!$?%\^&\*;:{}=\-_`~()]/g, '')
}

export function removePunctuation(input: string){
    return input.replace(/[.,\/#!$?%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g," ")
}

export function containsNumbers(str) {
    return /\d/.test(str);
}

export function containsPunctuation(str) {
    return /\p{P}/gu.test(str);
}