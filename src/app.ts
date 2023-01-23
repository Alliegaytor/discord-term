import { TextChannel, Guild, Client, ChannelType, Message, DMChannel, ClientOptions, User, PermissionsBitField} from "discord.js";
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
import {UserId} from "./types.js";


export type IAppNodes = {
    readonly messages: Widgets.BoxElement;

    readonly channels: Widgets.BoxElement;

    readonly input: Widgets.TextboxElement;

    readonly header: Widgets.BoxElement;

    readonly servers: Widgets.BoxElement;
}

export interface IAppOptions extends IStateOptions {
    readonly maxFetchMessages: number;

    readonly screen: Widgets.Screen;

    readonly nodes: IAppNodes;

    readonly commandPrefix: string;

    readonly headerAutoHideTimeoutPerChar: number;

    readonly initialState: Partial<IState>;

    readonly clientOptions: ClientOptions;

    readonly pluginsPath: string;

    readonly leftWidth: string;

    readonly rightWidth: string;

    readonly headerPrefix: string;

    readonly maxScreenLines: number;

    helpString: string;
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

    public __dirname: string = "";

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

    public async setup(init: boolean = true): Promise<this> {
        // Discord events.
        this.client.on("ready", () => {
            this.hideHeader();

            this.state.update({
                token: this.client.token as string
            });

            // Return if this.client.user is null just in case
            if (this.client.user === null) {
                this.message.error(`Error: this.client.user is null`);
                return;
            }

            this.message.system(`Successfully connected as {bold}${this.client.user.tag}{/bold}`);

            const firstGuild: Guild | undefined = this.client.guilds.cache.first();

            if (firstGuild) {
                this.setActiveGuild(firstGuild);
            }

            this.toggleChannels();
            // this.toggleGuilds();
            this.showHeader(`Type ${this.options.commandPrefix}tg to show the guild switch menu`, true);
            this.state.saveSync();
        });

        this.client.on("messageCreate", this.handleMessage.bind(this));

        this.client.on("error", (error: Error) => {
            this.message.error(`An error occurred within the client: ${error.message}`);
        });

        this.client.on("guildCreate", (guild: Guild) => {
            this.message.system(`Joined guild '{bold}${guild.name}{/bold}' (${guild.memberCount} members)`);
        });

        this.client.on("guildDelete", (guild: Guild) => {
            this.message.system(`Left guild '{bold}${guild.name}{/bold}' (${guild.memberCount} members)`);
            if (guild === this.state.get().guild) {
                this.message.warn("Client was viewing this guild!");
                this.setActiveGuild(this.client.guilds.cache.first() as Guild);
            }
        });

        // Append nodes.
        this.options.screen.append(this.options.nodes.input);
        this.options.screen.append(this.options.nodes.messages);
        this.options.screen.append(this.options.nodes.channels);
        this.options.screen.append(this.options.nodes.servers);
        this.options.screen.append(this.options.nodes.header);

        // Sync state.
        await this.state.sync();

        // Load & apply saved theme.
        this.loadTheme(this.state.get().theme);

        // Detect emoji preference
        this.options.screen.fullUnicode = this.state.get().emojisEnabled;

        if (init) {
            this.init();
        }

        return this;
    }

    private handleMessage(msg: Message): void {
        // Client should not be able to get here if this.client.user is null
        if (this.client.user === null) {
            throw ("Error: this.client.user is null");
        }

        const state: IState = this.state.get();
        const channel: TextChannel | undefined = state.channel;


        if (msg.author.id === this.client.user.id) {
            this.state.update({
                lastMessage: msg
            });
        }

        if (state.ignoredUsers.includes(msg.author.id)) {
            return;
        }
        else if (state.trackList.includes(msg.author.id)) {
            this.message.special("Track", msg.author.tag, msg.content);

            return;
        }
        else if (state.ignoreBots && msg.author.bot && msg.author.id !== this.client.user.id) {
            return;
        }
        else if (state.ignoreEmptyMessages && !msg.content) {
            return;
        }

        let content: string = msg.cleanContent;

        if (content.startsWith("$dt_")) {
            try {
                content = Encryption.decrypt(content.substr(4), state.decriptionKey);
            }
            catch (error) {
                // Don't show the error.
                //this.appendSystemMessage(`Could not decrypt message: ${error.message}`);
            }
        }

        if (msg.author.id === this.client.user.id) {
            if (msg.channel.type === ChannelType.GuildText) {
                this.message.self(this.client.user.tag, content);
            }
            else if (msg.channel.type === ChannelType.DM) {
                let recipient: User = this.client.users.cache.get(msg.channel.recipientId) as User;
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
            this.message.special("Global", msg.author.tag, content);
        }
    }

    // Handles resizing blessed boxes
    public blessedNodeWidths(width: number) {
        // Resets widths
        if (width === 0) {
            this.options.nodes.messages.width = "100%";
            this.options.nodes.messages.left = "0%";
            // Input.
            this.options.nodes.input.width = "100%";
            this.options.nodes.input.left = "0%"
            // Header.
            this.options.nodes.header.width = "100%";
            this.options.nodes.header.left = "0%";
            // Channels.
            this.options.nodes.channels.left = "0";
            this.options.nodes.channels.hide();
            this.options.nodes.channels.free();
            // Servers.
            this.options.nodes.servers.hide();
            this.options.nodes.channels.free();
        }
        // Messages.
        this.options.nodes.messages.width = this.options.nodes.messages.width as number - width;
        this.options.nodes.messages.left = this.options.nodes.messages.left as number + width;
        // Input.
        this.options.nodes.input.width = this.options.nodes.input.width as number - width;
        this.options.nodes.input.left = this.options.nodes.input.left as number + width;
        // Header.
        this.options.nodes.header.width = this.options.nodes.header.width as number -width;
        this.options.nodes.header.left = this.options.nodes.header.left as number + width;
    }

    public showChannels() {
        this.blessedNodeWidths(18);
        this.options.nodes.channels.show();
        this.render();
    }

    public hideChannels() {
        this.blessedNodeWidths(-18);
        this.options.nodes.channels.hide();
        this.options.nodes.channels.free();
        this.render();
    }

    // Toggle channel visibility
    public toggleChannels() {
        this.options.nodes.channels.visible ? this.hideChannels() : this.updateChannels() && this.showChannels();
    }

    public showGuilds() {
        this.blessedNodeWidths(18);

        if (this.options.nodes.channels.visible) {
            this.options.nodes.channels.left = "18";
        }

        this.options.nodes.servers.show();
        this.render();
    }

    public hideGuilds() {
        this.blessedNodeWidths(-18);
        this.options.nodes.channels.left = "0";
        this.options.nodes.servers.hide();
        this.options.nodes.servers.free();
        this.render();
    }

    // Toggle server visibility
    public toggleGuilds() {
        this.options.nodes.servers.visible ? this.hideGuilds() : this.updateGuilds() && this.showGuilds();
    }

    private setupEvents(): this {
        setupEvents(this);

        return this;
    }

    /**
     * Show the client as typing in the currently
     * active channel.
     */
    // TODO: Cleanup startTyping()
    public async startTyping() {
        let state: IState = this.state.get();
        // If it can type
        if (!state.muted && state.guild && state.channel) {
            // If it has never typed or it has been more than 10 seconds since the last time
            if (state.typingLastChannel !== state.channel || new Date().getTime() - state.typingLastStarted > 10000) {
                // Update state
                this.state.update({
                    typingLastStarted: new Date().getTime(),
                    typingLastChannel: state.channel
                });

                // Start typing and catch errors
                await state.channel.sendTyping().catch((error: Error) => {
                    this.message.error(`startTyping() failed: ${error.message}`);
                })
            }
        }
    }

    public getInput(clear: boolean = false): string {
        const value: string = this.options.nodes.input.getValue();

        if (clear) {
            this.clearInput();
        }

        return value.trim();
    }

    public clearInput(newValue: string = ""): this {
        this.options.nodes.input.setValue(newValue);

        if (this.options.screen.focused !== this.options.nodes.input) {
            this.options.nodes.input.focus();
        }

        this.render();

        return this;
    }

    public appendInput(value: string): this {
        this.clearInput(this.getInput() + value);

        return this;
    }

    /**
     * Destroy the client, save the state and exit
     * the application.
     */
    public shutdown(exitCode: number = 0): this {
        this.client.destroy();
        this.state.saveSync();
        process.exit(exitCode);
    }

    public updateChannels(render: boolean = false): this {
        const guild: Guild | undefined = this.state.get().guild;

        // Return if undefined
        if (!guild) {
            return this;
        }
        // Fixes "ghost" children bug.
        while (this.options.nodes.channels.children.length > 0) {
            this.options.nodes.channels.remove(this.options.nodes.channels.children[0]);
        }

        // Grab all available text channels
        const channels: TextChannel[] = Utils.getChannels(guild, ChannelType.GuildText) as TextChannel[];


        for (let i: number = 0; i < channels.length; i++) {
            let channelName: string = channels[i].name
                // This fixes UI being messed up due to channel names containing unicode emojis.
                .replace(Pattern.channels, "?");

            // Shrink channels to the right width
            while (Utils.visibleLength(channelName) + 2 >= (this.options.nodes.channels.width as number)) {
                channelName = channelName.slice(0, -1);
            }

            const channelNode: Widgets.BoxElement = blessed.box({
                style: {
                    bg: this.state.get().themeData.channels.backgroundColor,
                    fg: this.state.get().themeData.channels.foregroundColor,

                    bold: this.state.get().channel !== undefined && this.state.get().channel?.id === channels[i].id,

                    hover: {
                        bg: this.state.get().themeData.channels.backgroundColorHover,
                        fg: this.state.get().themeData.channels.foregroundColorHover
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
                const channel = this.state.get().channel as TextChannel;
                if (this.state.get().guild && channels[i].id !== channel.id && guild.channels.cache.has(channels[i].id)) {
                    this.setActiveChannel(channels[i]);
                    this.updateChannels(true);
                }
            });

            this.options.nodes.channels.append(channelNode);
        }

        if (render) {
            this.render(false, false);
        }

        return this;
    }

    public updateGuilds(render: boolean = false): this {
        // Grab all available guilds
        const guilds: Guild[] = Utils.getGuilds(this.client.guilds);

        // Fixes "ghost" children bug.
        while (this.options.nodes.servers.children.length > 0) {
            this.options.nodes.servers.remove(this.options.nodes.servers.children[0]);
        }


        for (let i: number = 0; i < guilds.length; i++) {
            let guildName: string = guilds[i].name
                // This fixes UI being messed up due to channel names containing unicode emojis.
                .replace(Pattern.channels, "?");

            // Shrink channels to the right width
            while (Utils.visibleLength(guildName) + 2 >= (this.options.nodes.servers.width as number)) {
                guildName = guildName.slice(0, -1);
            }

            const guildNode: Widgets.BoxElement = blessed.box({
                style: {
                    bg: this.state.get().themeData.channels.backgroundColor,
                    fg: this.state.get().themeData.channels.foregroundColor,

                    // TODO: Not working
                    // bold: this.state.get().guild !== undefined && this.state.get().guild?.id === guilds[i].id,

                    hover: {
                        bg: this.state.get().themeData.channels.backgroundColorHover,
                        fg: this.state.get().themeData.channels.foregroundColorHover
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
                const guild: Guild = this.state.get().guild as Guild;
                if (this.state.get().guild && guilds[i].id !== guild.id) {
                    this.setActiveGuild(guilds[i]);
                    this.updateChannels(true);
                }
            });

            this.options.nodes.servers.append(guildNode);
        }

        if (render) {
            this.render(false, false);
        }

        return this;
    }

    private setupInternalCommands(): this {
        setupInternalCommands(this);

        return this;
    }

    public loadTheme(name: string): this {
        if (!name) {
            return this;
        }
        // TODO: Trivial expression.
        /*else if (this.state.theme === name) {
            return this;
        }*/

        // TODO: Allow to change themes folder path (by option).
        const themePath: string = path.join(this.__dirname, "themes", `${name}.json`);

        if (name === defaultState.theme) {
            this.setTheme(defaultState.theme, defaultState.themeData, 0);
        }
        else if (fs.existsSync(themePath)) {
            this.message.system(`Loading theme '{bold}${name}{/bold}' ...`);

            // TODO: Verify schema.
            const theme: any = fs.readFileSync(themePath).toString();

            // TODO: Catch possible parsing errors.
            this.setTheme(name, JSON.parse(theme), theme.length);
        }
        else {
            this.message.warn(`The theme {bold}"${name}"{/bold} could not be found (Are you sure thats under the {bold}themes{/bold} folder?)`);
        }

        return this;
    }

    public setTheme(name: string, data: any, length: number): this {
        if (!data) {
            this.message.error("Error while setting theme: No data was provided for the theme");

            return this;
        }

        this.state.update({
            theme: name,
            themeData: data
        });

        // Messages.
        this.options.nodes.messages.style.fg = this.state.get().themeData.messages.foregroundColor;
        this.options.nodes.messages.style.bg = this.state.get().themeData.messages.backgroundColor;

        // Input.
        this.options.nodes.input.style.fg = this.state.get().themeData.input.foregroundColor;
        this.options.nodes.input.style.bg = this.state.get().themeData.input.backgroundColor;

        // Channels.
        this.options.nodes.channels.style.fg = this.state.get().themeData.channels.foregroundColor;
        this.options.nodes.channels.style.bg = this.state.get().themeData.channels.backgroundColor;

        // Header.
        this.options.nodes.header.style.fg = this.state.get().themeData.header.foregroundColor;
        this.options.nodes.header.style.bg = this.state.get().themeData.header.backgroundColor;

        this.updateChannels();
        this.message.system(`Applied theme '${name}' (${length} bytes)`);

        return this;
    }

    private updateTitle(): this {
        const state: IState = this.state.get();
        if (state.guild && state.channel) {
            this.options.screen.title = `Discord Terminal @ ${state.guild.name} # ${state.channel.name}`;
        }
        else if (state.guild) {
            this.options.screen.title = `Discord Terminal @ ${state.guild.name}`;
        }
        else {
            this.options.screen.title = "Discord Terminal";
        }

        return this;
    }

    public login(token: string): this {
        this.client.login(token).catch((error: Error) => {
            this.message.error(`Login failed: ${error.message}`);
        });

        return this;
    }

    public init(): this {
        const clipboard: string = clipboardy.readSync();

        if (process.env.DTERM_TOKEN !== undefined) {
            this.message.system("Attempting to login using environment token");
            this.login(process.env.DTERM_TOKEN);
        }
        else if (this.state.get().token) {
            this.message.system(`Attempting to login using saved token; Use {bold}${this.options.commandPrefix}forget{/bold} to forget the token`);
            this.login(this.state.get().token as string);
        }
        else if (Pattern.token.test(clipboard)) {
            this.message.system("Attempting to login using token in clipboard");
            this.login(clipboard);
        }
        else {
            this.options.nodes.input.setValue(`${this.options.commandPrefix}login `);
            this.showHeader("{bold}Pro Tip.{/bold} Set the environment variable {bold}DTERM_TOKEN{/bold} to automagically login!");
            this.message.system("Welcome! Please login using {bold}/login <token>{/bold} or {bold}/help{/bold} to view available commands");
        }

        this.setupEvents()
            .setupInternalCommands();

        return this;
    }

    public setActiveGuild(guild: Guild): this {
        this.state.update({
            guild
        });

        if (!guild) {
            this.message.warn(`Guild undefined`);
            return this;
        }

        this.message.system(`Switched to guild '{bold}${guild.name}{/bold}'`);
        if (this.state.get().header) {
            this.showHeader(`Guild: ${guild.name}`);
        }

        const defaultChannel: TextChannel | null = Utils.findDefaultChannel(guild);

        if (defaultChannel !== null) {
            this.setActiveChannel(defaultChannel);
        }
        else {
            this.message.warn(`Guild '${guild.name}' doesn't have any text channels`);
            // Sets current channel to undefined
            // This is very important as it makes sure the client can't delete channels from other servers
            this.state.update({
                channel: undefined
            })
        }

        this.updateTitle();
        this.updateChannels(true);

        return this;
    }

    public showHeader(text: string, autoHide: boolean = false) {
        if (!text) {
            throw new Error("[App.showHeader] Expecting header text");
        }
        // Remember intial text
        const headerIntialText: string = this.options.nodes.header.content;
        const headerEnabled: boolean = this.state.get().header;

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
            if (this.state.get().autoHideHeaderTimeout) {
                clearTimeout(this.state.get().autoHideHeaderTimeout);
            }
            // Reset text if header enabled
            if (headerEnabled) {
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

    public setActiveChannel(channel: TextChannel): this {

        this.state.update({
            channel
        });

        this.updateTitle();
        this.message.system(`Switched to channel '{bold}${channel.name}{/bold}'`);

        this.loadPreviousMessages(channel);

        return this;
    }

    // Load previous messages in a channel
    public loadPreviousMessages(channel: TextChannel): void {
        const permsNeeded: Array<bigint> = [PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ViewChannel];
        const hasPerms: Array<boolean> = Utils.permissionCheck(channel, this.client.user?.id as UserId, permsNeeded);
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

        channel.messages.fetch({limit: fetchlimit})
            .then(messages => {
                this.message.system(`Loading ${messages.size} most recent messages`);
                messages.reverse().forEach(msg => this.handleMessage(msg));
            })
            .catch(err => {
                this.message.error(err);
                this.message.warn("Could not fetch recent messages");
            });
    }

    public render(hard: boolean = false, updateChannels: boolean = false): this {
        if (updateChannels) {
            this.updateChannels(false);
        }

        if (!hard) {
            this.options.screen.render();
        }
        else {
            this.options.screen.realloc();
        }

        return this;
    }

    // Displays where the client is
    // TODO: Display whereAmI at the top of the screen at all times
    public whereAmI(channel: TextChannel, guild: Guild): this {
        if (guild && channel) {
            this.message.system(`Currently on guild '{bold}${guild.name}{/bold}' # '{bold}${channel.name}{/bold}'`)
        }
        else if (guild) {
            this.message.system(`Currently on guild '{bold}${guild.name}{/bold}`);
        }
        else {
            this.message.system("No active guild");
        }
        return this;
    }

    // Deletes specified channel
    // TODO: ADD SAFEGAURDS TO THIS
    public async deleteChannel(channel: TextChannel) {
        if (!channel) {
            return;
        }

        await channel.delete()
            .then(() => {
                this.updateChannels();
                this.message.system(`Deleted channel '{bold}${channel.name}{/bold}'`);
            })
            // Move to another channel if there is one
            .then(() => {
                const guild: Guild = this.state.get().guild as Guild;
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
    public editMessage(message: Message, editedMessage:string) {
        const msg: string = message.content;
        message.edit(editedMessage)
            .then(() => {
                this.message.system(`Message edited from "${msg}" -> "${editedMessage}"`);
            })
            .catch((err) => {
                this.message.error(`${err}`);
                this.message.warn(`Could not edit message '${message.id}'`)
            });
    }
}
