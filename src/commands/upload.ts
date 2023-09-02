import { TextChannel } from "discord.js";
import { existsSync } from "fs";
import App from "../app.js";

// Upload handler
export default function uploadHandler(app: App, file: string, recipient: string | TextChannel, userdm = false): void {
    // Check to see if not a directory
    if (file.split("").pop() === "/") {
        throw "Upload: Cannot upload a directory!";
    }
    // Don't upload token
    else if (file.split("/").pop() === "state.json") {
        throw "Upload: Cannot upload state.json!";
    }

    // Check to see if image exists
    if (!existsSync(file)) {
        throw `Upload: ${file} does not exist!`;
    }

    // DM message
    if (userdm) {
        app.client.users.fetch(recipient as string)
            .then(user => {
                user.send({ files: [file] });
                app.message.system(`Upload: Sent ${user} ${file}`);
            })
            .catch((error: Error) => {
                app.message.error(`Upload: Unable to send image: ${error.message}`);
            });
    }

    // Channel message
    else {
        const channel: TextChannel = recipient as TextChannel;
        void channel.send({ files: [file] })
            .then(() => app.message.system(`Upload: Sent ${recipient as string} ${file}`))
            .catch((error: Error) => {
                app.message.error(`Upload: Unable to send image: ${error.message}`);
            });
    }
}
