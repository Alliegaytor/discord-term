import { IAppOptions } from "./app.js";
import blessed from "blessed";
import { defaultState } from "./state/stateConstants.js";
import { Partials, GatewayIntentBits, PermissionsBitField } from "discord.js";
import path from "path";

export const tips: string[] = [
    "You can use the {bold}{prefix}sync{/bold} command to discard unsaved changes and reload saved state",
    "You can use the {bold}{prefix}format{/bold} command to change the message format style",
    "Toggle full-screen chat using the {bold}{prefix}fullscreen{/bold} command",
    "Command autocomplete is supported, type {bold}{prefix}he{/bold} then press tab to try it!",
    "Press {bold}ESC{/bold} anytime to clear the current input",
    "Press {bold}UP{/bold} to edit your last message",
    "Exiting with {bold}CTRL + C{/bold} is recommended since it will automatically save state",
    "Press {bold}CTRL + X{/bold} to force exit without saving state",
    "Use {bold}{prefix}/tg{/bold} to toggle on/off the guild menu",
    "Use {bold}{prefix}/tc{/bold} to toggle on/off the channels menu",
    "You can toggle emoji support on/off with {bold}{prefix}emoji{/bold}",
    "The debug menu can be accessed with {bold}{prefix}debug{/bold}"
];

export const permissionList: { [key: string]: bigint[] } = {
    deleteChannel: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ViewChannel],
    loadPrevious: [PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ViewChannel]
};

export const defaultAppOptions: IAppOptions = {
    clientOptions: {
        shards: "auto",
        intents: [
            // Guilds
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMessageTyping,
            // Direct Messages
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.DirectMessageTyping,
            // Messages
            GatewayIntentBits.MessageContent,
        ],
        partials: [
            Partials.Channel, // Required to receive DMs
        ],
        allowedMentions: { parse: ["users", "roles"] }
    },
    initialState: {},
    maxFetchMessages: 50,
    configPath: path.join(process.env.APPDATA || (process.platform == "darwin" ? process.env.HOME + "/Library/Preferences" : process.env.HOME + "/.local/share"), "discord-term"),
    stateFilePath: "state.json",
    pluginsPath: "plugins",
    headerAutoHideTimeoutPerChar: 100,
    headerPrefix: "[!] ",
    maxScreenLines: 200,

    screen: blessed.screen({
        // smartCSR: true, // Breaks emojis
        fastCSR: true,
        fullUnicode: defaultState.emojisEnabled,
        forceUnicode: true,
    }),

    nodes: {
        input: blessed.textbox({
            bottom: "0",
            left: "0%",
            width: "100%",
            height: "shrink",

            style: {
                fg: defaultState.themeData.input.foregroundColor,
                bg: defaultState.themeData.input.backgroundColor
            },

            inputOnFocus: true,
            padding: 1
        }),

        messages: blessed.box({
            top: "0%",
            left: "0%",
            width: "100%",
            height: "100%-3",

            style: {
                fg: defaultState.themeData.messages.foregroundColor,
                bg: defaultState.themeData.messages.backgroundColor
            },

            scrollable: true,
            tags: true,
            padding: 1,
            mouse: true,
        }),

        channels: blessed.box({
            top: "0%",
            left: "0%",
            width: "0%+17",
            height: "100%",

            style: {
                fg: defaultState.themeData.channels.foregroundColor,
                bg: defaultState.themeData.channels.backgroundColor
            },

            scrollable: true,
            padding: 1,
            hidden: true,
            mouse: true,
        }),

        servers: blessed.box({
            top: "0%",
            left: "0%",
            width: "0%+17",
            height: "100%",

            style: {
                fg: defaultState.themeData.servers.foregroundColor,
                bg: defaultState.themeData.servers.backgroundColor
            },

            scrollable: true,
            padding: 1,
            hidden: true,
            mouse: true,
        }),

        header: blessed.box({
            top: "0%",
            left: "0%",
            height: "0%+3",
            width: "100%",

            style: {
                fg: defaultState.themeData.header.foregroundColor,
                bg: defaultState.themeData.header.backgroundColor
            },

            padding: 1,
            hidden: true,
            tags: true
        })
    }
};
