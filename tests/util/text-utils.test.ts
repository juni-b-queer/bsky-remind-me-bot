import {describe, expect, test} from "bun:test";
import {flattenText} from "../../src/util/text-utils.ts";

describe("flattenText removes spaces", () => {
    test("Single space", () => {
        let input = "well actually"
        let expected = "wellactually"
        expect(flattenText(input)).toBe(expected);
    });

    test("multiple spaces", () => {
        let input = "well         actually"
        let expected = "wellactually"
        expect(flattenText(input)).toBe(expected);
    });

    test("spaces between letters", () => {
        let input = "w e l l a c t u a l l y"
        let expected = "wellactually"
        expect(flattenText(input)).toBe(expected);
    });
});

describe("flattenText removes punctuation", () => {
    test("Single Comma", () => {
        let input = "well, actually"
        let expected = "wellactually"
        expect(flattenText(input)).toBe(expected);
    });

    test("multiple commas", () => {
        let input = "well,,, actually"
        let expected = "wellactually"
        expect(flattenText(input)).toBe(expected);
    });

    test("other punctuation", () => {
        let input = "well!?.,:actually"
        let expected = "wellactually"
        expect(flattenText(input)).toBe(expected);
    });
});

describe("flattenText converts to lowercase", () => {
    test("All caps", () => {
        let input = "WELL ACTUALLY"
        let expected = "wellactually"
        expect(flattenText(input)).toBe(expected);
    });
});