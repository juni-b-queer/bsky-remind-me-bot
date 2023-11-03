/**
 * Flatten Text runs a number of string mutations to remove special characters, spaces, and convert it to lower case
 * @param input
 */
export function flattenText(input: string): string{
    return input
        .toLowerCase()
        .replace(/[^a-zA-Z]/g, '')
}