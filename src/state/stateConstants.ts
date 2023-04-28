import { IState } from "./state.js";

export const defaultState: IState = {
    messageFormat: "<{sender}> {message}",
    theme: "default",
    decryptionKey: "discord-term",
    ignoreEmptyMessages: true,
    globalMessages: false,
    ignoreBots: false,
    encrypt: false,
    header: true,
    emojisEnabled: false,
    userId: "",
    trackList: [],
    wordPins: [],
    ignoredUsers: [],
    tags: {},

    themeData: {
        input: {
            foregroundColor: "gray",
            backgroundColor: "lightgray"
        },

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

        servers: {
            foregroundColor: "white",
            backgroundColor: "black",
            foregroundColorHover: "white",
            backgroundColorHover: "gray"
        },

        header: {
            foregroundColor: "black",
            backgroundColor: "white"
        }
    }
};


// State properties excluded from saveSync()
export const excludeProperties: (keyof IState)[] = [
    "guild",
    "channel",
    "messageHistory",
    "typingTimeout",
    "autoHideHeaderTimeout",
    "themeData",
    "helpString",
    "typingLastChannel",
    "typingLastStarted",
];
