import {describe, expect, test} from "bun:test";
import {
    containsNumbers,
    containsPunctuation, convertTextToDate,
    flattenTextUpdated,
    removePunctuation
} from "../../src/utils/text-utils.ts";
import {add} from "date-fns";

describe("flattenTextUpdated Handles keys", () => {
    test("Key contains Spaces, Keeps spaces", () => {
        let key = "well actually"
        let input = "well actually"
        let expected = "well actually"
        expect(flattenTextUpdated(key, input)).toBe(expected);
    });
    test("Key does not contain Spaces, remove spaces", () => {
        let key = "wellactually"
        let input = "well actually"
        let expected = "wellactually"
        expect(flattenTextUpdated(key, input)).toBe(expected);
    });

    test("Key contains Numbers, Keeps Numbers", () => {
        let key = "well1"
        let input = "well1"
        let expected = "well1"
        expect(flattenTextUpdated(key, input)).toBe(expected);
    });
    test("Key does not contain Numbers, remove Numbers", () => {
        let key = "well"
        let input = "well1"
        let expected = "well"
        expect(flattenTextUpdated(key, input)).toBe(expected);
    });

    test("Key contains Punctuation, Keeps Punctuation", () => {
        let key = "well!"
        let input = "well!"
        let expected = "well!"
        expect(flattenTextUpdated(key, input)).toBe(expected);
    });
    test("Key does not contain Punctuation, remove Punctuation", () => {
        let key = "well"
        let input = "well!"
        let expected = "well"
        expect(flattenTextUpdated(key, input)).toBe(expected);
    });

    test("Key contains All, Keeps All", () => {
        let key = "keywith all ! 10"
        let input = "well! a random number 100"
        let expected = "well! a random number 100"
        expect(flattenTextUpdated(key, input)).toBe(expected);
    });
    test("Key does not contain Any, remove All", () => {
        let key = "well"
        let input = "well!1 hello"
        let expected = "wellhello"
        expect(flattenTextUpdated(key, input)).toBe(expected);
    });

});

describe("convertTextToDate Correctly generates the right date", () => {

    let currentTime = new Date();
    let exampleStrings = ["2 days", "3 hours", "1 year", "three hours and 20 minutes", "1 month, 2 weeks, five days and 20 minutes", "tomorrow", "next week", "invalid input"]

    test("Test example: 2 days", () => {
        expect(convertTextToDate(exampleStrings[0], currentTime)).toBe(add(currentTime, {['days']: Number('2')}).toISOString());
    });

    test("Test example: 3 hours", () => {
        expect(convertTextToDate(exampleStrings[1], currentTime)).toBe(add(currentTime, {['hours']: Number('3')}).toISOString());
    });

    test("Test example: 1 year", () => {
        expect(convertTextToDate(exampleStrings[2], currentTime)).toBe(add(currentTime, {['years']: Number('1')}).toISOString());
    });

    test("Test example: three hours and 20 minutes", () => {
        expect(convertTextToDate(exampleStrings[3], currentTime)).toBe(add(currentTime, {['hours']: Number('3'), ['minutes']: Number('20')}).toISOString());
    });

    test("Test example: 1 month, 2 weeks, five days and 20 minutes", () => {
        expect(convertTextToDate(exampleStrings[4], currentTime))
            .toBe(add(currentTime, {['months']: Number('1'), ['weeks']: Number('2'), ['days']: Number('5'), ['minutes']: Number('20')}).toISOString());
    });

    test("Test example: tomorrow", () => {
        expect(convertTextToDate(exampleStrings[5], currentTime)).toBe(add(currentTime, {['days']: Number('1')}).toISOString());
    });

    test("Test example: next week", () => {
        expect(convertTextToDate(exampleStrings[6], currentTime)).toBe(add(currentTime, {['weeks']: Number('1')}).toISOString());
    });

    test("Test example: invalid input", () => {
        expect(convertTextToDate(exampleStrings[7], currentTime)).toBe('');
    });
});