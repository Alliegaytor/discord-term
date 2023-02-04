import crypto, { Decipher, Cipher } from "crypto";
import App from "./app.js";

export default abstract class Encryption {
    public static encrypt(message: string, password: string): string {
        const iv: Buffer = crypto.randomBytes(16);

        const derivedKey: Buffer = crypto.createHash("sha256").update(password, "utf8").digest();
        const cipher: Cipher = crypto.createCipheriv("aes-256-cbc", derivedKey, iv);

        let result: string = iv.toString("hex") + cipher.update(message, "utf8", "hex");

        try {
            result += cipher.final("hex");
        }
        catch (error) {
            throw new Error("Incorrect password or decryption error.");
        }

        return result;
    }

    public static decrypt(encryptedMessage: string, app: App, password: string | undefined): string {
        if (!password) {
            return encryptedMessage;
        }

        const iv = Buffer.from(encryptedMessage.slice(0, 32), "hex");
        const encryptedMessageWithoutIv: string = encryptedMessage.slice(32);

        const derivedKey: Buffer = crypto.createHash("sha256").update(password, "utf8").digest();
        const decipher: Decipher = crypto.createDecipheriv("aes-256-cbc", derivedKey, iv);

        let result: string = decipher.update(encryptedMessageWithoutIv, "hex", "utf8");

        try {
            result += decipher.final("utf8");
        }
        catch (error) {
            app.message.error("Incorrect password or decryption error.");
        }

        return result;
    }
}
