import fs from "fs";
import path from "path";
import App from "../app.js";
import { Snowflake, Message, TextChannel, Guild } from "discord.js";
import { tips } from "../constant.js";
import Utils from "../utils.js";

export default function setupInternalCommands(app: App): void {
    app.commands.set("login", (args: string[]) => {
        app.login(args[0]);
    });

    app.commands.set("logout", async () => {
        app.shutdown();
    });

    // Display where client is
    app.commands.set("where", () => {
        const channel = app.state.get().channel as TextChannel;
        const guild = app.state.get().guild as Guild;

        app.whereAmI(channel as TextChannel, guild as Guild);
    })

    app.commands.set("mute", () => {
        app.state.update({
            muted: !app.state.get().muted
        });

        if (app.state.get().muted) {
            app.message.system("Muted mode activated");
        }
        else {
            app.message.system("Muted mode is no longer activated");
        }
    });

    app.commands.set("ignore", (args: string[]) => {
        if (!args[0]) {
            if (app.state.get().ignoredUsers.length === 0) {
                app.message.system("Not ignoring anyone");

                return;
            }

            const usersString: string = app.state.get().ignoredUsers.map((userId: Snowflake) => `@{bold}${userId}{/bold}`).join(", ");

            app.message.system(`Currently ignoring messages from: ${usersString}`);
        }
        else if (app.client.user && app.client.user.id === args[0]) {
            app.message.system("You can't ignore yourself, silly");
        }
        else if (app.state.get().ignoredUsers.includes(args[0])) {
            app.state.get().ignoredUsers.splice(app.state.get().ignoredUsers.indexOf(args[0]), 1);
            app.message.system(`Removed user @{bold}${args[0]}{/bold} from the ignore list`);
        }
        else {
            if (app.state.get().trackList.includes(args[0])) {
                app.state.get().trackList.splice(app.state.get().trackList.indexOf(args[0]), 1);
                app.message.system(`No longer tracking @{bold}${args[0]}{/bold}`);
            }

            app.state.get().ignoredUsers.push(args[0]);
            app.message.system(`Added user @{bold}${args[0]}{/bold} to the ignore list`);
        }
    });

    // Edit messages
    // (And delete if the edit is "")
    app.commands.set("edit", async (args: string[]) => {
        const state = app.state.get();

        // TODO: Display message.
        if (!args[0] || !state.channel) {
            return;
        }

        // See if message exists
        const message: Message | void | undefined = await state.lastMessage?.channel.messages.fetch(args[0]).catch(() => {
            app.message.system("That message doesn't exist or it is not editable");
        });

        // If message is defined continue
        if (message ?? false) {
            let msg: Message = message as Message;
            // Delete if the edit is ""
            if (!args[1]) {
                app.deleteMessage(message as Message);
            }
            else {
                const editedMessage = args.slice(1).join(" ");
                msg.edit(editedMessage);
                app.message.system(`Message edited to "${editedMessage}"`);
            }
        }
    });

    // Delete messages
    app.commands.set("delete", async (args: string[]) => {
        const state = app.state.get();

        if (!args || !state.channel) {
            return;
        }

        // See if message exists
        const message: Message | void | undefined = await state.lastMessage?.channel.messages.fetch(args[0]).catch(() => {
            app.message.system("That message doesn't exist or it is not editable");
        });

        // If message is defined continue
        if (message ?? false) {
            app.deleteMessage(message as Message);
        }
    })

    app.commands.set("save", () => {
        app.state.saveSync();
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
                token: undefined
            });

            app.state.saveSync();
        }
    });

    app.commands.set("encrypt", (args: string[]) => {
        if (!args[0]) {
            app.message.system("You must provide a password");

            return;
        }

        app.state.update({
            decriptionKey: args[0]
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
            app.message.system(`The current theme is '{bold}${app.state.get().theme}{/bold}'`)

            return;
        }

        app.loadTheme(args[0]);
    });

    app.commands.set("themes", () => {
        const themesPath: string = path.join(app.__dirname, "themes");

        if (fs.existsSync(themesPath)) {
            let files: string[] = fs.readdirSync(themesPath);

            for (let i: number = 0; i < files.length; i++) {
                files[i] = files[i].replace(".json", "");
            }

            const themesString: string = files.join("\n") + "\ndefault";

            app.message.system(themesString);
        }
        else {
            app.message.system("Themes directory does not exist");
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
            app.tags.set(args[0], args[1]);
            app.message.system(`Successfully saved tag '{bold}${args[0]}{/bold}'`);
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
            .replace("{prefix}", app.options.commandPrefix);

        app.showHeader(tip, true);
    });

    app.commands.set("dm", async (args: string[]) => {
        if (!args[0] || !args[1]) {
            app.message.system("Expecting both recipient and message arguments");

            return;
        }

        args[0] = args[0].replace(/\D/g, "");

        await app.client.users.fetch(args[0]).then(user => {
            user.send(args.slice(1).join(" ")).catch((error: Error) => {
                app.message.system(`Unable to send message: ${error.message}`);
            });
        });
    });

    // Toggles channels visibility
    app.commands.set("fullscreen", () => {
        app.toggleChannels();
    });

    // Displays name#1234 and ping. Example output:
    // <System> Logged in as Test#5782 | 216ms
    app.commands.set("me", () => {
        // TODO: Add valid method to check if logged in.
        if (app.client.user) {
            app.message.system(`Logged in as {bold}${app.client.user.tag}{/bold} | {bold}${Math.round(app.client.ws.ping)}{/bold}ms`);
        }
        else {
            app.message.system("Not logged in");
        }
    });

    app.commands.set("sync", () => {
        app.state.sync();
    });

    app.commands.set("pin", (args: string[]) => {
        if (!args[0]) {
            if (app.state.get().wordPins.length === 0) {
                app.message.system("No set word pins");

                return;
            }

            const wordPinsString: string = app.state.get().wordPins.map((pin: string) => `{bold}${pin}{/bold}`).join(", ");

            app.message.system(`Word pins: ${wordPinsString}`);
        }
        else if (app.state.get().wordPins.includes(args[0])) {
            app.state.get().wordPins.splice(app.state.get().wordPins.indexOf(args[0]), 1);
            app.message.system(`Removed word '{bold}${args[0]}{/bold}' from pins`);
        }
        else {
            app.state.get().wordPins.push(args[0]);
            app.message.system(`Added word '{bold}${args[0]}{/bold}' to pins`);
        }
    });

    app.commands.set("track", (args: string[]) => {
        if (!args[0]) {
            if (app.state.get().trackList.length === 0) {
                app.message.system("Not tracking anyone");

                return;
            }

            const usersString: string = app.state.get().trackList.map((userId: Snowflake) => `@{bold}${userId}{/bold}`).join(", ");

            app.message.system(`Tracking users: ${usersString}`);
        }
        else if (app.client.user && app.client.user.id === args[0]) {
            app.message.system("You can't track yourself, silly");
        }
        else if (app.state.get().trackList.includes(args[0])) {
            app.state.get().trackList.splice(app.state.get().trackList.indexOf(args[0]), 1);
            app.message.system(`No longer tracking @{bold}${args[0]}{/bold}`);
        }
        else if (app.client.users.cache.has(args[0])) {
            if (app.state.get().ignoredUsers.includes(args[0])) {
                app.message.system("You must first stop ignoring that user");

                return;
            }

            app.state.get().trackList.push(args[0]);
            app.message.system(`Now tracking @{bold}${args[0]}{/bold}`);
        }
        else {
            app.message.system("No such user cached");
        }
    });

    // TODO: format /help better
    // TODO: have a dictonary in constants and use that if there is an argument for a specific help cmd
    app.commands.set("help", () => {
        // Generate /help only if needed
        if (app.helpString === "") {
            let helpList: Array<string> = [];

            for (let [name] of app.commands) {
                helpList.push(name);
            }

            // Join Array
            app.helpString = helpList.join(", ");
        }

        app.message.system(`Commands available: \n${app.helpString}`);
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

    app.commands.set("c", (args: string[]) => {
        const state = app.state.get();

        if (!state.guild) {
            app.message.system("No active guild");
        }
        else if (state.guild.channels.cache.has(args[0])) {
            // TODO: Verify that it's a text channel.
            app.setActiveChannel(state.guild.channels.cache.get(args[0]) as TextChannel);
        }
        else {
            const channel = state.guild.channels.cache.find((channel) => channel.type === "GUILD_TEXT" && (channel.name === args[0] || "#" + channel.name === args[0])) as TextChannel;

            if (channel) {
                app.setActiveChannel(channel as TextChannel);
            }
            else {
                app.message.system(`Such channel does not exist in guild '${state.guild.name}'`);
            }
        }
    });

    app.commands.set("g", (args: string[]) => {
        if (app.client.guilds.cache.has(args[0])) {
            app.setActiveGuild(app.client.guilds.cache.get(args[0]) as Guild);
        }
        else {
            app.message.system("Such guild does not exist");
        }
    });

    // Resets and refreshes everything
    app.commands.set("reset", () => {
        const channel = app.state.get().channel as TextChannel;
        const guild = app.state.get().guild as Guild;

        // Reset
        app.options.nodes.messages.setContent("");
        app.render(true, true);
        app.updateChannels(true);

        // Show previous messages and where the client is
        app.loadPreviousMessages(channel as TextChannel);
        app.whereAmI(channel as TextChannel, guild as Guild);
    });

    // Deletes channels
    app.commands.set("deletechannel", () => {
        const channel = app.state.get().channel as TextChannel;
        const guild = app.state.get().guild as Guild;

        // Move to another channel
        app.setActiveGuild(guild as Guild);
        // Delete the channel specified
        app.deleteChannel(channel as TextChannel);
        // Let user know where they are now
        app.whereAmI(channel as TextChannel, guild as Guild);

    });
}
