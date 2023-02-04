import App from "./app.js";
import Encryption from "./encryption.js";
import { IState } from "./state/state.js";

export default function setupEvents(app: App): void {
    // Input.
    app.options.nodes.input.on("keypress", () => {
        // TODO: If logged in.
        app.startTyping();

    });

    // Tab completion
    app.options.nodes.input.key("tab", () => {
        const rawInput: string = app.getInput();
        const input: string = rawInput.substr(app.options.commandPrefix.length);

        if (!rawInput.startsWith(app.options.commandPrefix) || input.indexOf(" ") !== -1) {
            return;
        }

        // Prevent tab from moving cursor
        app.clearInput(`${rawInput}`);

        const autocomplete: Array<string> = [];
        for (const [name] of app.commands) {
            if (name.startsWith(input)) {
                autocomplete.push(name);
            }
        }

        switch (autocomplete.length) {
        case 0:
            // Let user know there is no command
            app.message.system(`No autocompletions for "${input}"`);
            break;
        case 1:
            // Autocomplete command
            app.clearInput(`${app.options.commandPrefix}${autocomplete[0]} `);
            break;
        default:
            // Show all available completions
            app.message.system(autocomplete.join(", "));
            break;
        }
    });

    // Format output
    app.options.nodes.input.key("enter", (t: App) => {
        let input: string = app.getInput(true);

        app.history = 0;

        const splitInput: string[] = input.split(" ");
        const tags: string[] = app.tags.getAll();

        // Format tags
        tags.find(tag => {
            if (splitInput.includes(`$${tag}`)) {
                splitInput[splitInput.indexOf(`$${tag}`)] = app.tags.get(tag);
            }
        });

        input = splitInput.join(" ").trim();

        if (input === "") {
            return;
        }
        else if (input.startsWith(app.options.commandPrefix)) {
            const args: string[] = input.substr(app.options.commandPrefix.length).split(" ");
            const base: string = args[0];

            if (app.commands.has(base)) {
                args.splice(0, 1);
                app.commands.get(base)!(args, t);
            }
            else {
                app.message.system(`Unknown command: ${base}`);
            }
        }
        else {
            const { guild, channel, encrypt, decryptionKey }: IState = app.state.get();

            if (guild && channel) {
                let msg: string = input;

                if (encrypt) {
                    msg = "$dt_" + Encryption.encrypt(msg, decryptionKey);
                }

                channel.send({ content: msg }).catch((error: Error) => {
                    app.message.error(`Unable to send message: ${error.message}`);
                });
            }
            else {
                app.message.system("No active text channel");
            }
        }

        app.clearInput();
    });

    app.options.nodes.input.key("escape", () => {
        app.history = 0;
        if (app.getInput().startsWith(app.options.commandPrefix)) {
            app.clearInput(app.options.commandPrefix);
        }
        else {
            app.clearInput();
        }
    });

    // Edit message
    app.options.nodes.input.key("up", () => {
        const { messageHistory, decryptionKey }: IState = app.state.get();
        if (messageHistory && app.history + 1 < messageHistory.length) {
            const message = messageHistory[app.history];
            if (message.content.startsWith("$dt_")) {
                message.content = Encryption.decrypt(message.content.substr(4), decryptionKey);
            }
            app.clearInput(`${app.options.commandPrefix}edit ${message.id} ${message.content}`);
            app.history++;
        }
    });

    // Edit message
    app.options.nodes.input.key("down", () => {
        const { messageHistory, decryptionKey }: IState = app.state.get();
        if (messageHistory && app.history > 0) {
            app.history--;
            const message = messageHistory[app.history];
            if (message.content.startsWith("$dt_")) {
                message.content = Encryption.decrypt(message.content.substr(4), decryptionKey);
            }
            app.clearInput(`${app.options.commandPrefix}edit ${message.id} ${message.content}`);
        }
    });

    app.options.nodes.input.key("C-c", () => {
        app.shutdown();
    });

    app.options.nodes.input.key("C-x", () => {
        process.exit(0);
    });
}
