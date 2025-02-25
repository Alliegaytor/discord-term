import { Snowflake, TextChannel, Guild, Message } from "discord.js";
import { EventEmitter } from "events";
import fs from "fs-extra";
import path from "path";
import { defaultState, excludeProperties } from "./stateConstants.js";
import App from "../app.js";
import { IThemes } from "./theme.js";

export interface IStateOptions {
    stateFilePath: string;
    configPath: string;
}

export interface IState {
    readonly channel?: TextChannel;
    readonly guild?: Guild;

    readonly globalMessages: boolean;
    readonly ignoreBots: boolean;
    readonly ignoreEmptyMessages: boolean;
    readonly header: boolean;
    readonly encrypt: boolean;
    readonly emojisEnabled: boolean;

    readonly typingLastStarted?: number;

    readonly token?: string;
    readonly tags: Record<string, string>;
    readonly theme: string;
    readonly wordPins: string[];
    readonly decryptionKey: string;
    readonly typingLastChannel?: string;
    readonly commandPrefix: string;
    readonly userId: string;
    readonly helpString?: string;
    readonly messageFormat: string;
    readonly themeFilePath: string;

    // TODO: Only grab the needed bits of the message to save on memory
    readonly messageHistory?: Message[];
    readonly typingTimeout?: NodeJS.Timeout;
    readonly autoHideHeaderTimeout?: NodeJS.Timeout;
    readonly trackList: Snowflake[];
    readonly ignoredUsers: Snowflake[];
    readonly themeData: IThemes;
}

export type IStateCopy = Record<string, unknown>;

export default class State extends EventEmitter {
    public options: IStateOptions;

    protected state: IState;

    protected readonly app: App;

    public constructor(app: App, options: IStateOptions, initialState?: Partial<IState>) {
        super();

        this.app = app;
        this.options = options;

        // Use local config if installed via git repo
        if (fs.existsSync(`${path.join(process.cwd(), ".git")}`)) {
            this.options.configPath = `${process.cwd()}`;
        }

        this.options.stateFilePath = path.join(this.options.configPath, this.options.stateFilePath);

        // Initialize the state.
        this.state = { ...defaultState, ...initialState };

        // Ensure state.json exists
        fs.ensureFileSync(this.options.stateFilePath);
    }

    public get(): IState {
        return { ...this.state };
    }

    /**
     * Change the application's state, triggering
     * a state change event.
     */
    public update(changes: Partial<IState>): this {
        this.emit("stateWillChange");

        // Store current state as previous state.
        const previousState: IState = this.state;

        // Update the state.
        this.state = { ...this.state, ...changes };

        // Fire the state change event. Provide the old and new state.
        this.emit("stateChanged", this.state, previousState);

        return this;
    }

    /**
     * Load and apply previously saved state from the
     * file system.
     */
    public async sync(): Promise<boolean> {
        return new Promise((resolve) => {
            fs.readFile(this.options.stateFilePath, (error, data) => {
                if (error) {
                    this.app.message.error(`There was an error while reading the state file: ${error.message}`);

                    resolve(false);

                    return;
                }

                // Don't parse if the file is empty
                if (Object.keys(data).length === 0) {
                    resolve(false);
                    return;
                }

                // Apply state
                this.state = {
                    ...JSON.parse(data.toString()),
                    guild: this.state.guild,
                    channel: this.state.channel,
                    themeData: this.state.themeData,
                };

                this.app.message.system(`Synced state @ ${this.options.stateFilePath} (${data.length} bytes)`);

                resolve(true);
            });
        });
    }

    /**
     * Write current included working state to the
     * file system.
     */
    public async saveSync(): Promise<boolean> {
        this.app.message.system("Saving application state ...");

        // Create a copy of the state and exclude the specified properties
        const stateCopy: IStateCopy = { ...this.state };
        for (const prop of excludeProperties) {
            delete stateCopy[prop];
        }

        // Create a human-readable JSON
        const data: string = JSON.stringify(stateCopy, (_, value) => typeof value === "string" ? value : value, 2);

        // Try to write to state.json
        return new Promise<boolean>((resolve) => {
            fs.writeFile(this.options.stateFilePath, data, (error: Error | null) => {
                if (error) {
                    this.app.message.error(`There was an error while writing the state file: ${error.message}`);

                    resolve(false);

                    return;
                }

                this.app.message.system(`Application state saved @ '${this.options.stateFilePath}' (${data.length} bytes)`);

                resolve(true);
            });
        });
    }
}
