import chalk, { ForegroundColorName } from "chalk";
import App, { SpecialSenders } from "../app.js";
import Utils from "../utils.js";
import { IState } from "../state/state.js";

export default class MessageFactory {
    protected readonly app: App;
    private readonly maxScreenLines: number;

    public constructor(app: App) {
        this.app = app;
        this.maxScreenLines = app.options.maxScreenLines;
    }

    private formatMessage(sender: string, message: string, senderColor: ForegroundColorName, messageColor?: ForegroundColorName): string {
        // Get the current state of the application
        const { themeData, messageFormat, emojisEnabled }: IState = this.app.state.get();
        const maximumWidth: number = this.app.options.nodes.messages.width as number;

        // If no message color is provided, use the default message color from the theme data
        messageColor = messageColor || themeData.messages.foregroundColor;
        let messageString = message.toString();

        // Apply the color to the message using Chalk library
        if (messageColor.startsWith("#")) {
            messageString = chalk.hex(messageColor)(messageString);
        }
        else if (typeof chalk[messageColor] !== "function") {
            this.system("Refusing to append message: An invalid color was provided");
            return "";
        }
        else {
            messageString = chalk[messageColor](message);
        }

        // Format sender and message
        const line = messageFormat
            .replace("{sender}", chalk[senderColor](sender))
            .replace("{message}", messageString)
            .replace(/\n/g, " \n");

        // If emojis are enabled, wrap the message text to the maximum width
        if (emojisEnabled) {
            const lines = Utils.wordWrapToStringList(line, maximumWidth - 1);
            return lines.join("\n");
        }
        else {
            return line;
        }
    }


    /**
     * Creates and appends a new message to the message node in the terminal.
     *
     * @param sender - The sender of the message.
     * @param message - The message content.
     * @param senderColor - The color of the sender text. Default is white.
     * @param messageColor - The color of the message text. Default is inherited from the theme.
     *
     * @returns - The Message instance.
     */
    public create(sender: string, message: string, senderColor: ForegroundColorName = "white", messageColor?: ForegroundColorName): this {
        const { nodes } = this.app.options;
        const lines: string[] = this.formatMessage(sender, message, senderColor, messageColor).split("\n");

        if (this.maxScreenLines != 0) {
            let screenLines = nodes.messages.getScreenLines().length ?? 0;
            while (screenLines + lines.length > this.maxScreenLines) {
                nodes.messages.deleteLine(0);
                screenLines--;
            }
        }

        lines.forEach(line => nodes.messages.pushLine(line));
        nodes.messages.setScrollPerc(100);
        this.app.render();

        return this;
    }

    /**
     * Add a user message to the chat window
     */
    public user(sender: string, message: string, modifiers: string[] = []): this {
        let name = `@${sender}`;

        name = modifiers.reduce((acc, current) => current + acc, name);

        this.create(name, message, "cyan");

        return this;
    }

    /**
     * Add a self message to the chat window
     */
    public self(name: string, message: string): this {
        this.create(`@{bold}${name}{/bold}`, message, "cyan");

        return this;
    }

    /**
     * Add a special message to the chat window
     */
    public special(prefix: string, sender: string, message: string, color = "yellow"): this {
        this.create(`${prefix} ~> @{bold}${sender}{/bold}`, message, color as ForegroundColorName);

        return this;
    }

    /**
     * Add a system message to the chat window
     */
    public system(message: string): this {
        this.create(`{bold}${SpecialSenders.System}{/bold}`, message, "green");

        return this;
    }

    /**
     * Add a warning message to the chat window
     */
    public warn(message: string): this {
        this.create(`{bold}${SpecialSenders.Warning}{/bold}`, message, "yellowBright");

        return this;
    }

    /**
     * Add an error message to the chat window
     */
    public error(message: string): this {
        this.create(`{bold}${SpecialSenders.Error}{/bold}`, message, "redBright");

        return this;
    }
}
