import {IState} from "./state.js";

export const defaultState: IState = {
    globalMessages: false,
    ignoreBots: false,
    ignoreEmptyMessages: true,
    muted: false,
    messageFormat: "<{sender}> {message}",
    trackList: [],
    wordPins: [],
    ignoredUsers: [],
    tags: {},
    theme: "default",
    decriptionKey: "discord-term",
    encrypt: false,
    header: true,
    typingLastStarted: 0,
    typingLastChannel: null,

    themeData: {
        messages: {
            foregroundColor: "white",
            backgroundColor: "gray"
        },

        channels: {
            foregroundColor: "white",
            backgroundColor: "black",
            foregroundColorHover: "white",
            backgroundColorHover: "gray"
        },

        input: {
            foregroundColor: "gray",
            backgroundColor: "lightgray"
        },

        header: {
            foregroundColor: "black",
            backgroundColor: "white"
        },

        servers: {
            foregroundColor: "white",
            backgroundColor: "black",
            foregroundColorHover: "white",
            backgroundColorHover: "gray"
        }
    }
};
