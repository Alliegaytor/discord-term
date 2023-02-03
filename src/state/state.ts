import { Snowflake, TextChannel, Guild, Message } from "discord.js";
import { EventEmitter } from "events";
import { ForegroundColorName } from "chalk";
import fs from "fs";
import { defaultState, excludeProperties } from "./stateConstants.js";
import App from "../app.js";

export interface IStateOptions {
    readonly stateFilePath: string;
}

export interface IState {
    readonly channel?: TextChannel;
    readonly guild?: Guild;

    readonly globalMessages: boolean;
    readonly ignoreBots: boolean;
    readonly ignoreEmptyMessages: boolean;
    readonly muted: boolean;
    readonly header: boolean;
    readonly encrypt: boolean;
    readonly emojisEnabled: boolean;

    readonly typingLastStarted: number;

    readonly token?: string;
    readonly tags: { [name: string]: string };
    readonly theme: string;
    readonly wordPins: string[];
    readonly decryptionKey: string;
    readonly typingLastChannel: string;
    readonly userId: string;
    readonly helpString: string;
    readonly messageFormat: string;

    // TODO: Only grab the needed bits of the message to save on memory
    readonly messageHistory?: Message[];
    readonly typingTimeout?: NodeJS.Timeout;
    readonly autoHideHeaderTimeout?: NodeJS.Timer;
    readonly trackList: Snowflake[];
    readonly ignoredUsers: Snowflake[];
    readonly themeData: Theme;
}

export interface Theme {
    readonly messages: Color;
    readonly channels: Color;
    readonly input: Color;
    readonly header: Color;
    readonly servers: Color;
}

export interface Color {
    readonly foregroundColor: ForegroundColorName;
    readonly backgroundColor: string;
    readonly backgroundColorHover?: string;
    readonly foregroundColorHover?: string;
}

export type IStateCopy = { [key: string]: unknown };

export default class State extends EventEmitter {
    public readonly options: IStateOptions;

    protected state: IState;

    protected readonly app: App;

    public constructor(app: App, options: IStateOptions, initialState?: Partial<IState>) {
        super();

        this.app = app;
        this.options = options;

        // Initialize the state.
        this.state = Object.assign({}, defaultState, initialState);
    }

    public get(): IState {
        return Object.assign({}, this.state);
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
        this.state = Object.assign({}, this.state, changes);

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
