import Utils from "../src/utils";
import {describe, expect} from '@jest/globals';

// TODO: Actually calculate how these properly
//       The expected test results were gathered
//       from the potentially broken function...

describe("wordWrapToStringList", () => {
    test("wrap words seperated with space", () => {
        const text: string = "The quick brown fox jumps over the lazy dog.";
        const maximumWidth: number = 20;
        const expectedResult: string[] = [
          "The quick brown fox",
          "jumps over the lazy",
          "dog."
        ];

        const result: string[] = Utils.wordWrapToStringList(text, maximumWidth);

        expect(result).toEqual(expectedResult);
    });
    test("wrap emojis seperated with space", () => {
        const text: string = "🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧 🐧";
        const maximumWidth: number = 20;
        const expectedResult: string[] = [
          "🐧 🐧 🐧 🐧 🐧 🐧 🐧",
          "🐧 🐧 🐧 🐧 🐧 🐧 🐧",
          "🐧 🐧 🐧 🐧 🐧 🐧 🐧"
        ];

        const result: string[] = Utils.wordWrapToStringList(text, maximumWidth);

        expect(result).toEqual(expectedResult);
    });
    // TODO: Emojis with no spaces, words longer than the maximumWidth, non-english languages...
});
