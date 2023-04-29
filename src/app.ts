import { TextChannel, Guild, Client, ChannelType, Message, ClientOptions, User, PermissionsBitField } from "discord.js";
import Utils from "./utils.js";
import blessed, { Widgets } from "blessed";
import chalk from "chalk";
import fs from "fs";
import clipboardy from "clipboardy";
import path from "path";
import Encryption from "./encryption.js";
import { defaultAppOptions } from "./constant.js";
import Pattern from "./pattern.js";
import setupEvents from "./events.js";
import setupInternalCommands from "./commands/internal.js";
import { EventEmitter } from "events";
import State, { IState, IStateOptions } from "./state/state.js";
import { defaultState } from "./state/stateConstants.js";
import MessageFactory from "./core/messageFactory.js";
import Tags from "./tags.js";
import Os from "os";

export interface IAppNodes {
    readonly input: Widgets.TextboxElement;
    readonly messages: Widgets.BoxElement;
    readonly channels: Widgets.BoxElement;
    readonly servers: Widgets.BoxElement;
    readonly header: Widgets.BoxElement;
}

export interface IAppOptions extends IStateOptions {
    readonly maxFetchMessages: number;
    readonly headerAutoHideTimeoutPerChar: number;
    readonly maxScreenLines: number;

    // readonly commandPrefix: string;
    readonly pluginsPath: string;
    readonly headerPrefix: string;

    readonly screen: Widgets.Screen;
    readonly nodes: IAppNodes;
    readonly clientOptions: ClientOptions;
    readonly initialState: Partial<IState>;
}

export enum SpecialSenders {
    System = "System",
    Warning = "Warning",
    Error = "Error"
}

export type ICommandHandler = (args: string[], app: App) => void;

export default class App extends EventEmitter {
    /**
     * Instance options for the application.
     */
    public readonly options: IAppOptions;
    /**
     * The Discord client class instance.
     */
    public readonly client: Client;
    /**
     * Registered commands usable by the client.
     */
    public readonly commands: Map<string, ICommandHandler>;

    public readonly state: State;
    public readonly message: MessageFactory;
    public readonly tags: Tags;

    public history = 0;

    public constructor(options?: Partial<IAppOptions>, commands: Map<string, ICommandHandler> = new Map()) {
        super();

        this.options = {
            ...defaultAppOptions,
            ...options
        };

        this.state = new State(this, this.options, this.options.initialState);
        this.client = new Client(this.options.clientOptions);
        this.commands = commands;
        this.message = new MessageFactory(this);
        this.tags = new Tags(this.state);
    }

    public async setup(init = true) {
        // Discord events.
        this.client.on("ready", () => {
            this.hideHeader();

            this.state.update({
                token: this.client.token as string
            });

            // Return if this.client.user is null just in case
            if (this.client.user === null) {
                this.message.error("Error: this.client.user is null");
                return;
            }

            this.message.system(`Successfully connected as {bold}${this.client.user.tag}{/bold}`);

            const firstGuild: Guild | undefined = this.client.guilds.cache.first();

            if (firstGuild) {
                this.setActiveGuild(firstGuild);
            }

            this.toggleChannels();
            // this.toggleGuilds(); // TODO: Set guild menu to toggle
            this.showHeader(`Type ${this.state.get().commandPrefix}tg to show the guild switch menu`, true);
            this.state.saveSync();
        });

        this.client.on("messageCreate", this.handleMessage.bind(this));

        // On error
        this.client.on("error", (error: Error) => {
            this.message.error(`An error occurred within the client: ${error.message}`);
        });

        // On guild creation
        this.client.on("guildCreate", (guild: Guild) => {
            this.message.system(`Joined guild '{bold}${guild.name}{/bold}' (${guild.memberCount} members)`);
        });

        // On guild deletion
        this.client.on("guildDelete", (guild: Guild) => {
            this.message.system(`Left guild '{bold}${guild.name}{/bold}' (${guild.memberCount} members)`);
            // Change active guild if client was on it
            if (guild === this.state.get().guild) {
                this.message.warn("Client was viewing this guild!");
                this.setActiveGuild(this.client.guilds.cache.first() as Guild);
            }
        });

        // Append nodes to screen
        Object.entries(this.options.nodes).forEach(([, value]) => this.options.screen.append(value));

        // Sync state.
        await this.state.sync();

        // Ensure commandPrefix isn't undefined
        if (!this.state.get().commandPrefix) {
            this.message.system("Setting commandPrefix to default");
            this.state.update({
                commandPrefix: "/"
            });
        }

        // Theme folder detection
        if (!this.state.get().themeFilePath) {
            let themeFilePath = undefined;
            if (fs.existsSync(`${process.cwd()}/.git/`)) {
                themeFilePath = `${path.join(process.argv[1], "../../themes/")}`;
            }
            else if (Os.platform() === "linux") {
                themeFilePath = path.join("/usr/lib/node_modules/discord-term-ng/themes/");
            }
            else if (Os.platform() === "win32") {
                themeFilePath = path.join(this.options.configPath, "AppData/Roaming/npm/node_modules/discord-term-ng/themes/");
            }
            this.state.update({
                themeFilePath
            });
        }

        // Load & apply saved theme.
        this.loadTheme(this.state.get().theme);

        // Set emoji preference
        this.options.screen.fullUnicode = this.state.get().emojisEnabled;

        if (init) {
            this.init();
        }
    }

    private handleMessage(msg: Message): void {
        // Client should not be able to get here if this.client.user is null
        if (this.client.user === null) {
            throw ("Error: this.client.user is null");
        }

        const state: IState = this.state.get();
        const channel: TextChannel | undefined = state.channel;

        const { messageHistory }: IState = this.state.get();


        if (msg.author.id === state.userId) {
            this.state.update({
                messageHistory: (messageHistory) ? [msg, ... messageHistory] : [msg]
            });
        }

        if (state.ignoredUsers.includes(msg.author.id)) {
            return;
        }
        else if (state.trackList.includes(msg.author.id)) {
            this.message.special("Track", msg.author.tag, msg.content);

            return;
        }
        else if (state.ignoreBots && msg.author.bot && msg.author.id !== state.userId) {
            return;
        }
        // else if (state.ignoreEmptyMessages && !msg.content) {
        //     return;
        // }

        // Check attachments & embeds
        const attachments = (msg.attachments.size > 0) ? true : false;
        const embeds = (msg.embeds.length > 0) ? true : false;

        let content: string = msg.cleanContent;

        if (attachments) {
            content += " < IMAGE >";
        }
        if (embeds) {
            content += " < EMBEDS >";
        }

        if (content.startsWith("$dt_")) {
            try {
                content = Encryption.decrypt(content.substr(4), this, state.decryptionKey);
            }
            catch (error) {
                // Don't show the error.
                //this.appendSystemMessage(`Could not decrypt message: ${error.message}`);
            }
        }

        if (msg.author.id === state.userId) {
            if (msg.channel.type === ChannelType.GuildText) {
                this.message.self(this.client.user.tag, content);
            }
            else if (msg.channel.type === ChannelType.DM) {
                const recipient: User = this.client.users.cache.get(msg.channel.recipientId) as User;
                this.message.special(`${chalk.magentaBright("=>")} DM to`, recipient.tag, content, "blue");
            }
        }

        else if (state.guild && channel && msg.channel.id === channel.id) {
            // TODO: Turn this into a function
            const modifiers: string[] = [];

            if (msg.guild && msg.member) {
                if (msg.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                    modifiers.push(chalk.red("+"));
                }

                if (msg.author.bot) {
                    modifiers.push(chalk.blue("&"));
                }
                if (msg.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                    modifiers.push(chalk.green("$"));
                }
            }

            this.message.user(msg.author.tag, content, modifiers);
        }
        else if (msg.channel.type === ChannelType.DM) {
            this.message.special(`${chalk.greenBright("<=")} DM from`, msg.author.tag, content, "blue");
        }
        else if (this.state.get().globalMessages) {
            this.message.special("Global", msg.author.tag, content, undefined);
        }
    }

    // Handles resizing blessed boxes
    // This can be looped over, but the nodes' arrangement might not stay the same
    public blessedNodeWidths(width: number) {
        // Resets widths
        if (width === 0) {
            // Input.
            this.options.nodes.input.width = "100%";
            this.options.nodes.input.left = "0%";
            // Messages.
            this.options.nodes.messages.width = "100%";
            this.options.nodes.messages.left = "0%";
            // Header.
            this.options.nodes.header.width = "100%";
            this.options.nodes.header.left = "0%";
            // Channels.
            this.options.nodes.channels.left = "0";
            this.options.nodes.channels.hide();
            this.options.nodes.channels.free();
            // Servers.
            this.options.nodes.servers.hide();
            this.options.nodes.servers.free();
        }
        // Input.
        (this.options.nodes.input.width as number) -= width;
        (this.options.nodes.input.left as number) += width;
        // Messages.
        (this.options.nodes.messages.width as number) -= width;
        (this.options.nodes.messages.left as number) += width;
        // Header.
        (this.options.nodes.header.width as number) -= width;
        (this.options.nodes.header.left as number) += width;
    }

    public showChannels() {
        this.blessedNodeWidths(18);

        if (this.options.nodes.servers.visible) {
            this.options.nodes.channels.left = "18";
        }

        this.options.nodes.channels.show();
        this.render(true);
    }

    public hideChannels() {
        this.blessedNodeWidths(-18);
        this.options.nodes.channels.hide();
        this.options.nodes.channels.free();
        this.render(true);
    }

    // Toggle channel visibility
    public toggleChannels() {
        this.options.nodes.channels.visible ? this.hideChannels() : (this.updateChannels(), this.showChannels());
    }

    public showGuilds() {
        this.blessedNodeWidths(18);

        if (this.options.nodes.channels.visible) {
            this.options.nodes.channels.left = "18";
        }

        this.options.nodes.servers.show();
        this.render(true);
    }

    public hideGuilds() {
        this.blessedNodeWidths(-18);
        this.options.nodes.channels.left = "0";
        this.options.nodes.servers.hide();
        this.options.nodes.servers.free();
        this.render(true);
    }

    // Toggle server visibility
    public toggleGuilds() {
        this.options.nodes.servers.visible ? this.hideGuilds() : (this.updateGuilds(), this.showGuilds());
    }

    private setupEvents() {
        setupEvents(this);

        return this;
    }

    /**
     * Show the client as typing in the currently
     * active channel.
     */
    // TODO: Cleanup startTyping()
    public async startTyping() {
        // Get context
        const { guild, channel, typingLastChannel, typingLastStarted }: IState = this.state.get();
        // Make sure client is in a channel
        if (guild && channel) {
            const timeNow: number = new Date().getTime();
            // If it has never typed or it has been more than 10 seconds since the last time
            if (!typingLastStarted || !typingLastChannel || typingLastChannel !== channel.id || timeNow - typingLastStarted > 10000) {
                // Update state
                this.state.update({
                    typingLastStarted: timeNow,
                    typingLastChannel: channel.id
                });

                // Start typing and catch errors
                await channel.sendTyping().catch((error: Error) => {
                    this.message.error(`startTyping() failed: ${error.message}`);
                });
            }
        }
    }

    public getInput(clear = false): string {
        const value: string = this.options.nodes.input.getValue();

        if (clear) {
            this.clearInput();
        }

        return value.trim();
    }

    public clearInput(newValue = "") {
        this.options.nodes.input.setValue(newValue);

        if (this.options.screen.focused !== this.options.nodes.input) {
            this.options.nodes.input.focus();
        }

        this.render();

    }

    public appendInput(value: string) {
        this.clearInput(this.getInput() + value);

    }

    /**
     * Destroy the client, save the state and exit
     * the application.
     */
    public async shutdown(exitCode = 0) {
        this.client.destroy();
        await this.state.saveSync();
        process.exit(exitCode);
    }

    public updateChannels(render = false) {
        const guild: Guild | undefined = this.state.get().guild;

        if (!guild) {
            return;
        }

        // Fixes "ghost" children bug.
        Object.entries(this.options.nodes.channels.children).forEach(([, value]) => {
            this.options.nodes.channels.remove(value);
        });

        // Grab all available text channels
        const channels: TextChannel[] = Utils.getChannels(guild, ChannelType.GuildText) as TextChannel[];
        const { themeData, channel }: IState = this.state.get();

        for (let i = 0; i < channels.length; i++) {
            let channelName: string = channels[i].name
                // This fixes UI being messed up due to channel names containing unicode emojis.
                .replace(Pattern.channels, "?");

            // Shrink channels to the right width
            const channelsWidth: number = this.options.nodes.channels.width as number;
            while (Utils.visibleLength(channelName) + 2 >= channelsWidth) {
                channelName = channelName.slice(0, -1);
            }

            const channelNode: Widgets.BoxElement = blessed.box({
                style: {
                    bg: themeData.channels.backgroundColor,
                    fg: themeData.channels.foregroundColor,

                    bold: channel !== undefined && channel.id === channels[i].id,

                    hover: {
                        bg: themeData.channels.backgroundColorHover,
                        fg: themeData.channels.foregroundColorHover
                    }
                },

                content: `#${channelName}`,
                width: "100%-2",
                height: "shrink",
                top: i,
                left: "0%",
                clickable: true
            });

            channelNode.on("click", () => {
                const { channel, guild }: IState = this.state.get();
                if (channel && guild && channels[i].id !== channel.id && guild.channels.cache.has(channels[i].id)) {
                    this.setActiveChannel(channels[i]);
                    this.updateChannels(true);
                }
            });

            this.options.nodes.channels.append(channelNode);
        }

        if (render) {
            this.render();
        }
    }

    public updateGuilds(render = false) {
        // Grab all available guilds
        const guilds: Guild[] = Utils.getGuilds(this.client.guilds);

        // Fixes "ghost" children bug.
        Object.entries(this.options.nodes.servers.children).forEach(([, value]) => {
            this.options.nodes.servers.remove(value);
        });

        const { guild, themeData }: IState = this.state.get();

        for (let i = 0; i < guilds.length; i++) {
            let guildName: string = guilds[i].name
                // This fixes UI being messed up due to channel names containing unicode emojis.
                .replace(Pattern.channels, "?");

            // Shrink channels to the right width
            while (Utils.visibleLength(guildName) + 2 >= (this.options.nodes.servers.width as number)) {
                guildName = guildName.slice(0, -1);
            }

            const guildNode: Widgets.BoxElement = blessed.box({
                style: {
                    bg: themeData.channels.backgroundColor,
                    fg: themeData.channels.foregroundColor,

                    bold: guild !== undefined && guild.id === guilds[i].id,

                    hover: {
                        bg: themeData.channels.backgroundColorHover,
                        fg: themeData.channels.foregroundColorHover
                    }
                },

                content: `#${guildName}`,
                width: "100%-2",
                height: "shrink",
                top: i,
                left: "0%",
                clickable: true
            });

            guildNode.on("click", () => {
                const { guild }: IState = this.state.get();
                if (guild && guilds[i].id !== guild.id) {
                    this.setActiveGuild(guilds[i]);
                    this.updateGuilds(true);
                }
            });

            this.options.nodes.servers.append(guildNode);
        }

        if (render) {
            this.render();
        }
    }

    // Get members in a server
    public printUsers(guild: Guild, limit = 20) {
        guild.members.fetch({ limit }).then(fetchedMembers => {
            const users: string[] = fetchedMembers.map(user => user.displayName);
            if (users.length === 20) {
                users.push("and more ...");
            }
            this.message.system(`Guild members: ${users.join(", ")}`);
        });
    }

    private setupInternalCommands() {
        setupInternalCommands(this);
    }

    public loadTheme(name: string) {
        const themePath: string = path.join(this.state.get().themeFilePath, `${name}.json`);
        if (name === defaultState.theme) {
            this.setTheme(defaultState.theme, defaultState.themeData, 0);
        }
        else if (fs.existsSync(themePath)) {
            this.message.system(`Loading theme '{bold}${name}{/bold}' ...`);

            // TODO: Verify schema.
            const theme: string = fs.readFileSync(themePath).toString();

            // TODO: Catch possible parsing errors.
            this.setTheme(name, JSON.parse(theme), theme.length);
        }
        else if (name === undefined) {
            this.loadTheme("dark-red");
        }
        else {
            this.message.warn(`The theme {bold}"${name}"{/bold} could not be found (Are you sure thats under the {bold}themes{/bold} folder?)`);
        }
    }

    public setTheme(name: string, data: IState["themeData"], length: number) {
        if (!data) {
            this.message.error("Error while setting theme: No data was provided for the theme");
        }

        this.state.update({
            theme: name,
            themeData: data
        });

        // Get theme data
        const { themeData }: IState = this.state.get();

        // Update each node to use the new theme
        Object.entries(this.options.nodes).forEach(([key, value]) => {
            value.style.fg = themeData[key].foregroundColor;
            value.style.bg = themeData[key].backgroundColor;
        });

        this.updateChannels();
        this.updateGuilds();
        this.message.system(`Applied theme '${name}' (${length} bytes)`);
    }

    private updateTitle() {
        // Destructure
        const { guild, channel }: IState = this.state.get();
        if (guild && channel) {
            this.options.screen.title = `Discord Terminal @ ${guild.name} # ${channel.name}`;
        }
        else if (guild) {
            this.options.screen.title = `Discord Terminal @ ${guild.name}`;
        }
        else {
            this.options.screen.title = "Discord Terminal";
        }
    }

    // Logs in client and remembers id (used to see if logged in)
    public login(token: string) {
        this.client.login(token)
            .then(() => {
                // Remember userid
                if (this.client.user) {
                    this.state.update({
                        userId: this.client.user.id
                    });
                }
                else {
                    throw "Cannot log in";
                }
            })
            .catch((error: Error) => {
                this.message.error(`Login failed: ${error.message}`);
            });
    }

    public init() {
        const clipboard: string = clipboardy.readSync();

        // Login with environment variable
        if (process.env.DTERM_TOKEN) {
            this.message.system("Attempting to login using environment token");
            this.login(process.env.DTERM_TOKEN);
        }
        // Login with saved token
        else if (this.state.get().token) {
            this.message.system(`Attempting to login using saved token; Use {bold}${this.state.get().commandPrefix}forget{/bold} to forget the token`);
            this.login(this.state.get().token as string);
        }
        // Login with clipboard
        else if (Pattern.token.test(clipboard)) {
            this.message.system("Attempting to login using token in clipboard");
            this.login(clipboard);
        }
        // If not logged in
        if (!this.state.get().userId) {
            this.options.nodes.input.setValue(`${this.state.get().commandPrefix}login `);
            this.showHeader("{bold}Pro Tip.{/bold} Set the environment variable {bold}DTERM_TOKEN{/bold} to automagically login!");
            this.message.system("Welcome! Please login using {bold}/login <token>{/bold} or {bold}/help{/bold} to view available commands");
        }

        this.setupEvents()
            .setupInternalCommands();
    }

    public setActiveGuild(guild: Guild) {
        this.state.update({
            guild,
            messageHistory: [],
            channel: undefined // To make sure the client can't delete channels from other servers
        });

        this.history = 0;

        if (!guild) {
            this.message.warn("Guild undefined");
            return this;
        }

        this.message.system(`Switched to guild '{bold}${guild.name}{/bold}'`);
        this.printUsers(guild);
        if (this.state.get().header) {
            this.showHeader(`Guild: ${guild.name}`);
        }

        const defaultChannel: TextChannel | null = Utils.findDefaultChannel(guild);

        if (defaultChannel) {
            this.setActiveChannel(defaultChannel);
        }
        else {
            this.message.warn(`Guild '${guild.name}' doesn't have any text channels`);
        }

        this.updateTitle();
        this.updateChannels(true);
    }

    public showHeader(text: string, autoHide = false) {
        if (!text) {
            throw new Error("[App.showHeader] Expecting header text");
        }
        // Remember intial text
        const headerIntialText: string = this.options.nodes.header.content;
        const { header, autoHideHeaderTimeout }: IState = this.state.get();

        this.options.nodes.header.content = `${this.options.headerPrefix + text}`;

        if (!this.options.nodes.header.visible) {
            // Messages.
            this.options.nodes.messages.top = "0%+3";
            this.options.nodes.messages.height = "100%-6";

            // Header.
            this.options.nodes.header.hidden = false;
        }

        // Autohides. Dependent on headerAutoHideTimeoutPerChar
        if (autoHide) {
            if (autoHideHeaderTimeout) {
                clearTimeout(autoHideHeaderTimeout);
            }
            // Reset text if header enabled
            if (header) {
                setTimeout(() => {
                    // If unchanged
                    if (this.options.nodes.header.content === this.options.headerPrefix + text) {
                        this.options.nodes.header.content = headerIntialText;
                        this.render();
                    }
                }, text.length * this.options.headerAutoHideTimeoutPerChar);
            }
            // Otherwise hide the header
            else {
                this.state.update({
                    autoHideHeaderTimeout: setTimeout(this.hideHeader.bind(this), text.length * this.options.headerAutoHideTimeoutPerChar)
                });
            }
        }

        this.render();
    }

    public hideHeader(): boolean {
        if (!this.options.nodes.header.visible) {
            return false;
        }

        // Messages.
        this.options.nodes.messages.top = "0%";
        this.options.nodes.messages.height = "100%-3";

        // Header.
        this.options.nodes.header.hidden = true;

        this.render();

        return true;
    }

    public setActiveChannel(channel: TextChannel) {

        this.state.update({
            channel,
            messageHistory: []
        });

        this.history = 0;

        this.updateTitle();
        this.message.system(`Switched to channel '{bold}${channel.name}{/bold}'`);

        this.loadPreviousMessages(channel);
    }

    // Load previous messages in a channel
    public loadPreviousMessages(channel: TextChannel) {
        const permsNeeded: bigint[] = [PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ViewChannel];
        const hasPerms: boolean[] = Utils.permissionCheck(channel, this.state.get().userId, permsNeeded);
        // Return if no perms
        if (hasPerms.indexOf(false) !== -1) {
            this.message.error(`Cannot load messages in ${channel.name} due to insufficient permissions "${permsNeeded[hasPerms.indexOf(false)]}"`);
            return;
        }

        // Find out how many messages to fetch
        let fetchlimit: number = this.options.nodes.messages.height as number - 3;
        if ((this.options.nodes.messages.height as number) > this.options.maxFetchMessages) {
            fetchlimit = this.options.maxFetchMessages;
        }

        channel.messages.fetch({ limit: fetchlimit })
            .then(messages => {
                this.message.system(`Loading ${messages.size} most recent messages`);
                messages.reverse().forEach(msg => this.handleMessage(msg));
            })
            .catch(err => {
                this.message.error(err);
                this.message.warn("Could not fetch recent messages");
            });
    }

    public render(hard = false) {

        if (!hard) {
            this.options.screen.render();
        }
        else {
            this.options.screen.realloc();
        }
    }

    // Displays where the client is
    // TODO: Display whereAmI at the top of the screen at all times
    public whereAmI(channel: TextChannel | undefined, guild: Guild | undefined) {
        if (guild && channel) {
            this.message.system(`Currently on guild '{bold}${guild.name}{/bold}' # '{bold}${channel.name}{/bold}'`);
        }
        else if (guild) {
            this.message.system(`Currently on guild '{bold}${guild.name}{/bold}`);
        }
        else {
            this.message.system("No active guild");
        }
    }

    // Deletes specified channel
    // TODO: ADD SAFEGAURDS TO THIS
    public async deleteChannel(channel: TextChannel) {
        const { guild }: IState = this.state.get();
        if (!channel || !guild) {
            this.message.warn("You must be in a channel to run this command");
            return;
        }

        await channel.delete()
            .then(() => {
                this.updateChannels();
                this.message.system(`Deleted channel '{bold}${channel.name}{/bold}'`);
                this.state.update({
                    channel: undefined
                });
            })
            // Move to another channel if there is one
            .then(() => {
                const newchannel: TextChannel | null = Utils.findDefaultChannel(guild);
                if (newchannel) {
                    this.setActiveChannel(newchannel);
                }
                else {
                    this.message.system(`The last text channel in ${guild.name} has been deleted`);
                }
            })
            // Catch errors
            .catch((err) => {
                this.message.error(`${err}`);
                this.message.warn(`Could not delete channel ${channel.name}`);
            });
    }

    // Delete message
    public deleteMessage(message: Message) {
        message.delete()
            .then(() => {
                this.message.system("Message deleted");
            })
            .catch(err => {
                this.message.error(`${err}`);
                this.message.warn(`Could not delete message '${message.id}'`);
            });
    }

    // Edit message
    public editMessage(message: Message, editedMessage: string, encrypt: boolean, decryptionKey: string) {
        const msg: string = message.content;
        if (encrypt) {
            editedMessage = "$dt_" + Encryption.encrypt(editedMessage, decryptionKey);
        }
        message.edit(editedMessage)
            .then(() => {
                this.message.system(`Message edited from "${msg}" -> "${editedMessage}"`);
            })
            .catch((err) => {
                this.message.error(`${err}`);
                this.message.warn(`Could not edit message '${message.id}'`);
            });
    }

    // Cycles through message history
    public cycleMessageHistory(change: number) {
        const { messageHistory, decryptionKey, commandPrefix }: IState = this.state.get();
        if (messageHistory && ((this.history  < messageHistory.length && change === 1) || (this.history > 1 && change === -1))) {
            this.history += change;
            const message = messageHistory[this.history - 1];
            if (message.content.startsWith("$dt_")) {
                message.content = Encryption.decrypt(message.content.substr(4), this, decryptionKey);
            }
            this.clearInput(`${commandPrefix}edit ${message.id} ${message.content}`);
            this.options.nodes.header.setText(`[${this.history}/${messageHistory.length}] Editing`);
            this.render();
        }
    }
}
