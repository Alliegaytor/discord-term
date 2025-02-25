import fs from "fs";
import App from "../app.js";
import { ChannelType, Snowflake, TextChannel, Guild } from "discord.js";
import { tips } from "../constant.js";
import Utils from "../utils.js";
import { IState } from "../state/state.js";
import uploadHandler from "./upload.js";
import Encryption from "../encryption.js";

export default function setupInternalCommands(app: App): void {
    app.commands.set("login", (args: string[]) => {
        app.login(args[0]);
    });

    app.commands.set("exit", () => {
        void app.shutdown();
    });

    // Display where client is
    app.commands.set("where", () => {
        const { channel, guild }: IState = app.state.get();

        app.whereAmI(channel, guild);
    });

    app.commands.set("ignore", (args: string[]) => {
        const { ignoredUsers, userId, trackList }: IState = app.state.get();

        if (!args[0]) {
            if (ignoredUsers.length === 0) {
                app.message.system("Not ignoring anyone");

                return;
            }

            const usersString: string = ignoredUsers.map((userId: Snowflake) => `@{bold}${userId}{/bold}`).join(", ");

            app.message.system(`Currently ignoring messages from: ${usersString}`);
        }
        else if (app.client.user && userId === args[0]) {
            app.message.system("You can't ignore yourself, silly");
        }
        else if (ignoredUsers.includes(args[0])) {
            ignoredUsers.splice(ignoredUsers.indexOf(args[0]), 1);
            app.message.system(`Removed user @{bold}${args[0]}{/bold} from the ignore list`);
        }
        else {
            if (trackList.includes(args[0])) {
                trackList.splice(trackList.indexOf(args[0]), 1);
                app.message.system(`No longer tracking @{bold}${args[0]}{/bold}`);
            }

            ignoredUsers.push(args[0]);
            app.message.system(`Added user @{bold}${args[0]}{/bold} to the ignore list`);
        }
    });

    // Edit messages
    // (And delete if the edit is "")
    app.commands.set("edit", (args: string[]) => {
        const { channel, encrypt, decryptionKey }: IState = app.state.get();

        // TODO: Display message.
        if (!args[0] || !channel) {
            app.message.warn("Expecting at least one argument");
            return;
        }

        // Find message then edit it
        channel.messages.fetch(args[0])
            .then((message) => {
                if (!args[1]) {
                    app.deleteMessage(message);
                }
                else {
                    const editedMessage: string = args.slice(1).join(" ");
                    app.editMessage(message, editedMessage, encrypt, decryptionKey);
                }
            })
            .catch(() => {
                app.message.warn("That message doesn't exist");
            });
    });

    // Delete messages
    app.commands.set("delete", (args: string[]) => {
        const { channel }: IState = app.state.get();

        if (!args[0] || args.length > 1 || !channel) {
            app.message.warn(`Expecting one argument instead of ${args.length}`);
            return;
        }

        // Find message then delete it
        channel.messages.fetch(args[0])
            .then((message) => {
                app.deleteMessage(message);
            })
            .catch(() => {
                app.message.warn("That message doesn't exist");
            });
    });

    app.commands.set("save", () => {
        void app.state.saveSync();
    });

    app.commands.set("format", (args: string[]) => {
        app.state.update({
            messageFormat: args.join(" ")
        });

        app.message.system(`Successfully changed format to '${app.state.get().messageFormat}'`);
    });

    app.commands.set("forget", () => {
        if (app.state.get().token) {
            app.state.update({
                token: undefined,
                userId: undefined
            });

            void app.state.saveSync();
        }
    });

    app.commands.set("encrypt", (args: string[]) => {
        if (!args[0]) {
            app.message.system(`Current password: ${app.state.get().decryptionKey}`);

            return;
        }

        app.state.update({
            decryptionKey: args[0]
        });

        app.message.system(`Using decryption key '{bold}${args[0]}{/bold}'`);
    });

    app.commands.set("doencrypt", () => {
        app.state.update({
            encrypt: !app.state.get().encrypt
        });

        if (app.state.get().encrypt) {
            app.message.system("Now encrypting messages");
        }
        else {
            app.message.system("No longer encrypting messages");
        }
    });

    app.commands.set("theme", (args: string[]) => {
        if (!args[0]) {
            app.message.system(`The current theme is '{bold}${app.state.get().theme}{/bold}'`);

            return;
        }

        app.loadTheme(args[0]);
    });

    app.commands.set("themes", () => {
        const themePath = `${app.state.get().themeFilePath}`;

        if (fs.existsSync(themePath)) {
            const files: string[] = fs.readdirSync(themePath);

            for (let i = 0; i < files.length; i++) {
                files[i] = files[i].replace(".json", "");
            }

            const themesString: string = files.join("\n") + "\ndefault";

            app.message.system(themesString);
        }
        else {
            app.message.error("Themes directory does not exist");
        }
    });

    app.commands.set("tag", (args: string[]) => {
        if (!args[0]) {
            const tags: string[] = app.tags.getAll();

            if (tags.length === 0) {
                app.message.system("No tags have been set");

                return;
            }

            const tagsString: string = tags.map((tag: string) => `{bold}${tag}{/bold}`).join(", ");

            app.message.system(`Tags: ${tagsString}`);
        }
        else if (args.length === 2) {
            if (/^-?\d+$/.test(args[1])) {
                app.tags.set(args[0], args[1]);
                app.message.system(`Successfully saved tag '{bold}${args[0]}{/bold}'`);
            }
            else {
                app.message.warn(`Tag: Could not tag ${args[0]} to ${args[1]} as it is not a valid channel/user id`);
            }
        }
        else if (args.length === 1 && app.tags.has(args[0])) {
            app.tags.delete(args[0]);
            app.message.system(`Successfully deleted tag '{bold}${args[0]}{/bold}'`);
        }
        else {
            app.message.system("Such tag does not exist");
        }
    });

    app.commands.set("tip", () => {
        // TODO: Replace all.
        const tip: string = tips[Utils.getRandomInt(0, tips.length - 1)]
            .replace("{prefix}", app.state.get().commandPrefix);

        app.showHeader(tip, true);
    });

    app.commands.set("dm", (args: string[]) => {
        if (!app.state.get().userId) {
            app.message.warn("Cannot DM: Not logged in!");
            return;
        }

        if (!args[0] || !args[1]) {
            app.message.warn("Expecting both recipient and message arguments");
            return;
        }

        // Make sure the user id is a number
        if (!/^-?\d+$/.test(args[0])) {
            app.message.warn(`DM: ${args[0]} is not a valid user id!`);
            return;
        }

        args[0] = args[0].replace(/\D/g, "");

        let msg: string = args.slice(1).join(" ");

        // Encryption
        if (app.state.get().encrypt) {
            msg = "$dt_" + Encryption.encrypt(msg, app.state.get().decryptionKey);
        }

        void app.client.users.fetch(args[0])
            .then(user => {
                user.send(msg).catch((error: Error) => {
                    app.message.error(`Could not send message: ${error.message}`);
                });
            })
            .catch((error: Error) => {
                app.message.error(`${error.message}`);
            });
    });

    // Toggles channels visibility
    app.commands.set("tc", () => {
        app.toggleChannels();
    });

    // Toggles servers visibility
    app.commands.set("tg", () => {
        app.toggleGuilds();
    });

    // Displays name#1234 and ping. Example output:
    // <System> Logged in as Test#5782 | 216ms
    app.commands.set("me", () => {
        // TODO: Add valid method to check if logged in.
        if (app.client.user) {
            app.message.system(`Logged in as {bold}${app.client.user.tag}{/bold} | {bold}${Math.round(app.client.ws.ping)}{/bold}ms`);
        }
        else {
            app.message.warn("Not logged in");
        }
    });

    app.commands.set("sync", () => {
        void app.state.sync();
    });

    app.commands.set("pin", (args: string[]) => {
        const wordPins: string[] = app.state.get().wordPins;

        if (!args[0]) {
            if (wordPins.length === 0) {
                app.message.system("No set word pins");

                return;
            }

            const wordPinsString: string = wordPins.map((pin: string) => `{bold}${pin}{/bold}`).join(", ");

            app.message.system(`Word pins: ${wordPinsString}`);
        }
        else if (wordPins.includes(args[0])) {
            wordPins.splice(wordPins.indexOf(args[0]), 1);
            app.message.system(`Removed word '{bold}${args[0]}{/bold}' from pins`);
        }
        else {
            wordPins.push(args[0]);
            app.message.system(`Added word '{bold}${args[0]}{/bold}' to pins`);
        }
    });

    app.commands.set("track", (args: string[]) => {
        const { trackList, userId, ignoredUsers }: IState = app.state.get();

        if (!args[0]) {
            if (trackList.length === 0) {
                app.message.system("Not tracking anyone");

                return;
            }

            const usersString: string = trackList.map((userId: Snowflake) => `@{bold}${userId}{/bold}`).join(", ");

            app.message.system(`Tracking users: ${usersString}`);
        }
        else if (app.client.user && userId === args[0]) {
            app.message.system("You can't track yourself, silly");
        }
        else if (trackList.includes(args[0])) {
            trackList.splice(trackList.indexOf(args[0]), 1);
            app.message.system(`No longer tracking @{bold}${args[0]}{/bold}`);
        }
        else if (app.client.users.cache.has(args[0])) {
            if (ignoredUsers.includes(args[0])) {
                app.message.system("You must first stop ignoring that user");

                return;
            }

            trackList.push(args[0]);
            app.message.system(`Now tracking @{bold}${args[0]}{/bold}`);
        }
        else {
            app.message.system("No such user cached");
        }
    });

    // TODO: format /help better
    // TODO: have a dictonary in constants and use that if there is an argument for a specific help cmd
    app.commands.set("help", () => {
        // Generate /help only once and save it
        if (!app.state.get().helpString) {
            const helpList: string[] = [];

            for (const [name] of app.commands) {
                helpList.push(name);
            }

            // Set help string
            app.state.update({
                helpString: helpList.join(", ")
            });
        }

        app.message.system(`Commands available: \n${app.state.get().helpString}`);
    });

    app.commands.set("global", () => {
        app.state.update({
            globalMessages: !app.state.get().globalMessages
        });

        if (app.state.get().globalMessages) {
            app.message.system("Displaying global messages");
        }
        else {
            app.message.system("No longer displaying global messages");
        }
    });

    // TODO: Fix command
    // app.commands.set("bots", () => {
    //     app.state.update({
    //         ignoreBots: !app.state.get().ignoreBots
    //     });
    //
    //     if (app.state.get().ignoreBots) {
    //         app.message.system("No longer displaying bot messages");
    //     }
    //     else {
    //         app.message.system("Displaying bot messages");
    //     }
    // });

    app.commands.set("clear", () => {
        app.options.nodes.messages.setContent("");
        app.render(true);
    });

    // Change channel
    app.commands.set("c", (args: string[]) => {
        const guild: Guild | undefined = app.state.get().guild;

        if (!guild) {
            app.message.system("No active guild");
        }
        else if (guild.channels.cache.has(args[0])) {
            // TODO: Verify that it's a text channel.
            app.setActiveChannel(guild.channels.cache.get(args[0]) as TextChannel);
        }
        else {
            const channel = guild.channels.cache.find((channel) => channel.type === ChannelType.GuildText && (channel.name === args[0] || "#" + channel.name === args[0])) as TextChannel;

            if (channel) {
                app.setActiveChannel(channel);
            }
            else {
                app.message.warn("Channel does not exist");
            }
        }
    });

    // Change guild
    app.commands.set("g", (args: string[]) => {
        if (app.client.guilds.cache.has(args[0])) {
            void app.setActiveGuild(app.client.guilds.cache.get(args[0])!);
        }
        else {
            app.message.warn(`Guild ${args[0]} does not exist`);
        }
    });

    // Resets and refreshes everything
    app.commands.set("reset", () => {
        const { channel, guild }: IState = app.state.get();

        // Reset
        app.options.nodes.messages.setContent("");
        app.blessedNodeWidths(0);
        app.render(true);
        app.updateChannels(true);
        app.showChannels();

        if (channel && guild) {
            // Show previous messages and where the client is
            app.loadPreviousMessages(channel);
            app.whereAmI(channel, guild);
        }
        else if (guild) {
            void app.setActiveGuild(guild);
        }

        // Reset message history
        app.state.update({
            messageHistory: []
        });
    });

    // Deletes channels
    app.commands.set("deletechannel", () => {
        const { channel, guild }: IState = app.state.get();

        // Do not delete channel if there is none
        if (!channel) {
            let message = "Could not delete: You are not on a channel!";
            if (guild) {
                message = message + ` This is because ${guild.name} has 0 text channels`;
            }
            app.message.system(message);
            return;
        }

        // Delete the channel specified
        void app.deleteChannel(channel);
    });

    // Toggle header
    app.commands.set("toggleheader", () => {
        app.options.nodes.header.visible ? app.hideHeader() : app.showHeader("Header activated!");
        // Toggle
        const header = !(app.state.get().header === true);
        app.state.update({
            header
        });
        app.message.system(`Header has been set to: ${header}`);
    });

    // Print debug info
    app.commands.set("debug", (args: string[]) => {
        // Verbose
        const verbose = args[0] === "-v" ? true: false;
        const guildsearchCount = verbose ? 10 : 1;

        // Message box demensions
        const width = app.options.nodes.messages.width as number;
        const height = app.options.nodes.messages.height as number;

        // System debug formatter
        function ams(str1: string, str2: string) {
            app.message.system(Utils.formatWide(str1, str2, width - 12));
        }

        app.message.break("-", width - 9);
        app.message.system("Debug info:");
        app.message.break("-", width - 9);

        ams("userId:", `${app.state.get().userId}`);
        ams("emojisEnabled:", `${app.state.get().emojisEnabled}`);
        ams("encryption:", `${app.state.get().encrypt}`);
        ams("theme:", `${app.state.get().theme}`);
        ams("history:", `${app.state.get().messageHistory?.length}`);

        app.message.break("-", width - 9);

        // Memory info
        app.message.system("Memory info:");
        const mem: NodeJS.MemoryUsage = process.memoryUsage();
        // Type can't be declared in for loop https://github.com/microsoft/TypeScript/issues/3500
        let key: keyof typeof mem;
        for (key in mem) {
            if (Object.prototype.hasOwnProperty.call(mem, key)) {
                ams(`→ ${key}`, `${Math.round(mem[key] / 1024 / 1024 * 100) / 100} MB`);
            }
        }

        app.message.break("-", width - 9);

        // Directories
        ams("Executable directory: ", `${process.argv[1]}`);
        ams("State file path:", app.options.stateFilePath);
        ams("Theme file path:", app.state.get().themeFilePath);

        app.message.break("-", width - 9);

        ams("Messagebox height:", `${height}`);
        verbose && height < 20 ? app.message.warn("Recommended heigh is >20") : null;
        ams("Messagebox width:", `${width}`);
        verbose && width < 70 ? app.message.warn("Recommended width is >70") : null;
        ams("Lines:", `${app.options.nodes.messages.getLines().length}`);

        app.message.break("-", width - 9);

        // Discord info
        const guilds: Guild[] = Utils.getGuilds(app.client.guilds);
        const guildNames: string[] = [];
        let guildMembers = 0;

        for (let i = 0 ; i < guildsearchCount && i < guilds.length; i++) {
            guildNames[i] = guilds[i].name;
            guildMembers = guildMembers + guilds[i].memberCount;
        }

        app.message.system("Discord stats:");
        app.message.system("Guilds");
        ams("→ count", `${guilds.length}`);
        app.message.system(`→ first ${guildNames.length}`);
        ams(":: names", `${guildNames.join(", ")}`);
        ams(":: members", `${guildMembers}`);
    });

    // Toggle emoji support
    app.commands.set("emoji", () => {
        const emojisEnabled = !(app.state.get().emojisEnabled === true);
        app.state.update({
            emojisEnabled
        });
        app.options.screen.fullUnicode = emojisEnabled;
        // app.options.nodes.messages.setContent("");
        app.render(true);
        app.message.system(`Emoji support have been set to: ${emojisEnabled}`);
    });

    // Uploads files
    app.commands.set("upload", (args: string[]) => {
        if (!app.state.get().userId) {
            app.message.warn("Img: Not logged in!");
            return;
        }

        const recepient: string | TextChannel = (args[1]) ? args[1] : app.state.get().channel!;
        const userdm: boolean = (args[1]) ? true : false;
        const file: string = (args[0]) ? `img/${args[0]}` : "img/miles.jpg";

        try {
            uploadHandler(app, file, recepient, userdm);
        }

        catch (error: unknown) {
            app.message.error("Could not upload file!");
        }
    });
}
