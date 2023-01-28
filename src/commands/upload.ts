import { TextChannel } from "discord.js";
import { existsSync } from "fs";
import { UserId } from "../types.js";
import App from "../app.js";

// Upload handler
export default function uploadHandler(app: App, file: string, recipient: UserId | TextChannel, userdm: boolean = false): void {
    // Check to see if not a directory
    if (file.split('').pop() === "/") {
        throw `Upload: Cannot upload a directory!`;
    }
    // Don't upload token
    else if (file.split('/').pop() === "state.json") {
        throw `Upload: Cannot upload state.json!`;
    }

    // Check to see if image exists
    if (!existsSync(file)) {
        throw `Upload: ${file} does not exist!`;
    }

    // DM message
    if (userdm) {
        app.client.users.fetch(recipient as UserId)
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
        channel.send({ files: [file] });
        app.message.system(`Upload: Sent ${recipient} ${file}`);
    }
}
