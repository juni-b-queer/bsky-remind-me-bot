import {describe, expect, test} from "bun:test";
import {containsNumbers, containsPunctuation, flattenText, removePunctuation} from "../../src/text-utils.ts";

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

describe("flattenText Handles Numbers", () => {
    test("remove numbers default when no numbers", () => {
        let input = "WELL ACTUALLY"
        let expected = "wellactually"
        expect(flattenText(input)).toBe(expected);
    });
    test("remove numbers default when numbers", () => {
        let input = "WELL ACTUALLY3"
        let expected = "wellactually"
        expect(flattenText(input)).toBe(expected);
    });

    test("Keep numbers when no numbers", () => {
        let input = "WELL ACTUALLY"
        let expected = "wellactually"
        expect(flattenText(input, true)).toBe(expected);
    });
    test("dont keep numbers when no numbers", () => {
        let input = "WELL ACTUALLY"
        let expected = "wellactually"
        expect(flattenText(input, false)).toBe(expected);
    });

    test("Keep numbers when numbers", () => {
        let input = "WELL ACTUALLY 3"
        let expected = "wellactually3"
        expect(flattenText(input, true)).toBe(expected);
    });
    test("dont keep numbers when numbers", () => {
        let input = "WELL ACTUALLY3"
        let expected = "wellactually"
        expect(flattenText(input, false)).toBe(expected);
    });

    test("Keep punctuation when no punctuation", () => {
        let input = "WELL ACTUALLY"
        let expected = "wellactually"
        expect(flattenText(input, false, true)).toBe(expected);
    });
    test("dont keep punctuation when no punctuation", () => {
        let input = "WELL ACTUALLY"
        let expected = "wellactually"
        expect(flattenText(input, false, false)).toBe(expected);
    });

    test("Keep punctuation when punctuation", () => {
        let input = "WELL ACTUALLY!"
        let expected = "wellactually!"
        expect(flattenText(input, false, true)).toBe(expected);
    });
    test("dont keep punctuation when punctuation", () => {
        let input = "WELL ACTUALLY!"
        let expected = "wellactually"
        expect(flattenText(input, false, false)).toBe(expected);
    });
});

describe("containsNumber is correct", () => {
    test("conatins no numbers", () => {
        let input = "WELL ACTUALLY"
        let expected = false
        expect(containsNumbers(input)).toBe(expected);
    });

    test("conatins numbers", () => {
        let input = "WELL ACTUALLY 34"
        let expected = true
        expect(containsNumbers(input)).toBe(expected);
    });
});

describe("containsPunctuation is correct", () => {
    test("conatins no punctuation", () => {
        let input = "WELL ACTUALLY"
        let expected = false
        expect(containsPunctuation(input)).toBe(expected);
    });

    test("conatins punctuation", () => {
        let input = "WELL, ACTUALLY"
        let expected = true
        expect(containsPunctuation(input)).toBe(expected);
    });
});

describe("removePunctuation works", () => {
    test("With Punctuation in between", () => {
        let input = "WELL ! ? .ACTUALLY"
        let expected = "WELL ACTUALLY"
        expect(removePunctuation(input)).toBe(expected);
    });

    test("With Punctuation at the end", () => {
        let input = "WELL ACTUALLY!"
        let expected = "WELL ACTUALLY"
        expect(removePunctuation(input)).toBe(expected);
    });

});

describe("flatten text works for 69", () => {

    test("with 69", () => {
        let input = "WELL ACTUALLY! im 69"
        let expected = "wellactuallyim69"
        let flattened = flattenText(input, containsNumbers('69'), containsPunctuation('69'))
        expect(flattened).toBe(expected);
        expect(flattened.includes('69')).toBe(true)
    });

});

