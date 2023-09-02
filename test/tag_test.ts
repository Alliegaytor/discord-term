import State from "../src/state/state.js";
import Tags from "../src/tags.js";

import { state } from "./test.js";
import { describe, expect } from "@jest/globals";

describe("Tags", () => {
    let tags: Tags;

    beforeEach(() => {
        const newstate: State = state ;
        tags = new Tags(newstate);
    });

    test("getAll", () => {
        tags.set("tag1", "value1");
        tags.set("tag2", "value2");

        expect(tags.getAll()).toEqual(["tag1", "tag2"]);
    });

    test("has", () => {
        tags.set("tag1", "value1");
        tags.set("tag2", "value2");

        expect(tags.has("tag1")).toBe(true);
        expect(tags.has("tag3")).toBe(false);
    });

    test("get", () => {
        tags.set("tag1", "value1");
        tags.set("tag2", "value2");

        expect(tags.get("tag1")).toBe("value1");
        expect(tags.get("tag3")).toBe(undefined);
    });

    test("set", () => {
        tags.set("tag1", "value1");
        tags.set("tag2", "value2");

        expect(tags.get("tag1")).toBe("value1");
        expect(tags.get("tag2")).toBe("value2");
    });

    test("delete", () => {
        tags.set("tag1", "value1");
        tags.set("tag2", "value2");

        expect(tags.delete("tag1")).toBe(true);
        expect(tags.delete("tag3")).toBe(false);
        expect(tags.getAll()).toEqual(["tag2"]);
    });
});
