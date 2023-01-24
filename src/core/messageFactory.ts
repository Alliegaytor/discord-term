import chalk, { ForegroundColorName } from "chalk";
import App, { SpecialSenders } from "../app.js";
import Utils from "../utils.js";
import { IState } from "../state/state.js";

export default class MessageFactory {
    protected readonly app: App;

    public constructor(app: App) {
        this.app = app;
    }

    // TODO: Also include time.
    public create(sender: string, message: string, senderColor: string = "white", messageColor?: ForegroundColorName): this {
        // Get current state
        let { themeData, messageFormat, emojisEnabled }: IState = this.app.state.get();

        // Set message color if not specified
        if (!messageColor) {
            messageColor = themeData.messages.foregroundColor;
        }

        let messageString: string = message.toString();

        if (messageColor.startsWith("#")) {
            messageString = chalk.hex(messageColor)(messageString);
        }
        //
        else if (chalk[messageColor] === undefined || typeof chalk[messageColor] !== "function") {
            this.system("Refusing to append message: An invalid color was provided");

            return this;
        }
        else {
            messageString = ((chalk as any)[messageColor] as any)(message);
        }

        let line: string = messageFormat
            // TODO: Catch error if sender color doesn't exist.
            // @ts-ignore
            .replace("{sender}", chalk[senderColor](sender))
            .replace("{message}", messageString)
            .replace(/\n/g, " \n"); // Fix for empty new lines

        // Remove old lines
        const maxScreenLines: number = this.app.options.maxScreenLines;
        if (maxScreenLines != 0) {
            let screenLines: number = this.app.options.nodes.messages.getScreenLines().length ?? 0;
            while (screenLines > maxScreenLines) {
                this.app.options.nodes.messages.deleteLine(0);
                screenLines--;
            }
        }

        // Fix blessed box hell
        // Calculate where to wrap lines because emojis are thicc
        if (emojisEnabled) {
            let maximumWidth: number = this.app.options.nodes.messages.width as number;
            let lines: Array<string> = Utils.wordWrapToStringList(line, maximumWidth - 1);

            // Push lines
            lines.forEach(element => {
                this.app.options.nodes.messages.pushLine(element);

            });
        }
        // Or do it the normal way without emojis
        else {
            this.app.options.nodes.messages.pushLine(line);
        }

        this.app.options.nodes.messages.setScrollPerc(100);
        this.app.render();

        return this;
    }

    public user(sender: string, message: string, modifiers: string[] = []): this {
        let name: string = `@${sender}`;

        if (modifiers.length > 0) {
            for (let i: number = 0; i < modifiers.length; i++) {
                name = modifiers[i] + name;
            }
        }

        this.create(name, message, "cyan");

        return this;
    }

    public self(name: string, message: string): this {
        this.create(`@{bold}${name}{/bold}`, message, "cyan");

        return this;
    }

    public special(prefix: string, sender: string, message: string, color: string = "yellow"): this {
        this.create(`${prefix} ~> @{bold}${sender}{/bold}`, message, color);

        return this;
    }

    public system(message: string): this {
        this.create(`{bold}${SpecialSenders.System}{/bold}`, message, "green");

        return this;
    }

    public warn(message: string): this {
        this.create(`{bold}${SpecialSenders.Warning}{/bold}`, message, "yellowBright");

        return this;
    }

    public error(message: string): this {
        this.create(`{bold}${SpecialSenders.Error}{/bold}`, message, "redBright");

        return this;
    }
}
