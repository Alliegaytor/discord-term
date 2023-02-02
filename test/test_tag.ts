import State from "../src/state/state.js";
import "../src/state/stateConstants.js";
import Tags from "../src/tags.js";
import App from "../src/app.js";
import { describe, expect } from "@jest/globals";

describe("Tags", () => {
    let tags: Tags;
    let state: State;
    const app: App = new App();

    beforeEach(() => {
        state = new State(app, app.options);
        tags = new Tags(state);
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
