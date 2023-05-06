import Utils from "../src/utils.js";
import { describe, expect } from "@jest/globals";

describe("wordWrapToString", () => {
    test("wrap words seperated with space", () => {
        const text = "The quick brown fox jumps over the lazy dog.";
        const maximumWidth = 20;
        const expectedResult: string[] = [
            "The quick brown fox",
            "jumps over the lazy",
            "dog."
        ];

        const result: string[] = Utils.wordWrapToString(text, maximumWidth).split("\n");

        expect(result).toEqual(expectedResult);
    });
    test("wrap emojis seperated with space", () => {
        const text = "🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧";
        const maximumWidth = 20;
        const expectedResult: string[] = [
            "🐧 🐧 🐧 🐧 🐧 🐧 🐧",
            "🐧 🐧 🐧 🐧 🐧 🐧 🐧",
            "🐧 🐧 🐧 🐧 🐧 🐧 🐧"
        ];

        const result: string[] = Utils.wordWrapToString(text, maximumWidth).split("\n");

        expect(result).toEqual(expectedResult);
    });
    test("wrap sus unicode with spaces", () => {
        const text = "ඞ they are among us ඞ";
        const maximumWidth = 10;
        const expectedResult: string[] = [
            "ඞ they are",
            "among us ඞ"
        ];

        const result: string[] = Utils.wordWrapToString(text, maximumWidth).split("\n");

        expect(result).toEqual(expectedResult);
    });
    // TODO: Emojis with no spaces, words longer than the maximumWidth, non-english languages...
});
