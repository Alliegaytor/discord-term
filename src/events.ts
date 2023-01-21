import App from "./app.js";
import Encryption from "./encryption.js";

export default function setupEvents(app: App): void {
    // Screen.
    app.options.screen.key("C-c", async () => {
        app.shutdown();
    });

    app.options.screen.key("C-x", () => {
        process.exit(0);
    });

    app.options.screen.key("space", () => {
        app.options.nodes.input.focus();
    });

    // Input.
    app.options.nodes.input.on("keypress", () => {
        // TODO: If logged in.
        app.startTyping();

    });

    // Tab completion
    app.options.nodes.input.key("tab", () => {
        const rawInput: string = app.getInput();
        const input: string = rawInput.substr(app.options.commandPrefix.length);

        if (rawInput.startsWith(app.options.commandPrefix) && input.indexOf(" ") === -1) {
            let autocomplete: Array<string> = [];
            // Prevent tab from moving cursor
            app.clearInput(`${rawInput}`);

            // Search help commands
            for (let [name] of app.commands) {
                if (name.startsWith(input)) {
                    autocomplete.push(name);
                }
            }
            // Auto complete if there is one match
            if (autocomplete.length === 1) {
                app.clearInput(`${app.options.commandPrefix}${autocomplete[0]} `);
            }
            // Show all available completions
            else if (autocomplete.length > 1) {
                app.message.system(autocomplete.join(", "));
            }
            // Let user know there is no command
            else {
                app.message.system(`No autocompletions for ${input}`);
            }
        }
    });



    app.options.nodes.input.key("enter", (t: any) => {
        let input: string = app.getInput(true);

        const splitInput: string[] = input.split(" ");
        const tags: string[] = app.tags.getAll();

        for (let i: number = 0; i < tags.length; i++) {
            while (splitInput.includes(`$${tags[i]}`)) {
                splitInput[splitInput.indexOf(`$${tags[i]}`)] = app.tags.get(tags[i]) as string;
            }
        }

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
            if (app.state.get().muted) {
                app.message.system(`Message not sent; Muted mode is active. Please use {bold}${app.options.commandPrefix}mute{/bold} to toggle`);
            }
            else if (app.state.get().guild && app.state.get().channel) {
                let msg: string = input;

                if (app.state.get().encrypt) {
                    msg = "$dt_" + Encryption.encrypt(msg, app.state.get().decriptionKey);
                }

                app.state.get().channel?.send({ content: msg }).catch((error: Error) => {
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
        if (app.getInput().startsWith(app.options.commandPrefix)) {
            app.clearInput(app.options.commandPrefix);
        }
        else {
            app.clearInput();
        }
    });

    // Edit last message
    // TODO: Check to see if last message has been deleted
    app.options.nodes.input.key("up", () => {
        if (app.state.get().lastMessage ?? false) {
            app.clearInput(`${app.options.commandPrefix}edit ${app.state.get().lastMessage?.id} ${app.state.get().lastMessage?.content}`);
        }
    });

    app.options.nodes.input.key("down", () => {
        //  if (app.client.user && app.client.user.lastMessage && app.client.user.lastMessage.deletable) {
        //      app.client.user.lastMessage.delete();
        //  }
        app.clearInput();
    });

    app.options.nodes.input.key("C-c", () => {
        app.shutdown();
    });

    app.options.nodes.input.key("C-x", () => {
        process.exit(0);
    });

    app.options.nodes.input.key("p", () => {
        return;
    });
}
