import { Guild, TextChannel, ChannelType, GuildBasedChannel, GuildManager, PermissionsBitField } from "discord.js";
import stringWidth from "string-width";

export default abstract class Utils {
    public static findDefaultChannel(guild: Guild): TextChannel | null {
        const channels: TextChannel[] = Utils.getChannels(guild, ChannelType.GuildText) as TextChannel[];

        // Return null if there are no text channels
        if (channels.length === 0) {
            return null;
        }

        // Return the "general" chat ?? the first channel
        return channels.find((channel: TextChannel) => channel.name.toLowerCase() === "general") ?? channels[0];
    }

    public static getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    // Checks to see if client has permissions on a channel in an array
    public static permissionCheck(channel: TextChannel, userid: string, permissions: bigint[]): boolean[] {
        const userperms = channel.permissionsFor(userid) as Readonly<PermissionsBitField>;
        const results: boolean[] = new Array(permissions.length);

        permissions.forEach((permission, i) => {
            if (userperms.has(permission, true)) {
                results[i] = true;
            }
            else {
                results[i] = false;
            }
        });

        return results;
    }

    // Returns guilds client is in as Guild[]
    public static getGuilds(guilds: GuildManager): Guild[] {
        return Array.from(guilds.cache.values());
    }

    // Returns text channels in a server as GuildBasedChannel[]
    // TODO: Handle different kinds of channls
    public static getChannels(guild: Guild, channeltype: ChannelType): GuildBasedChannel[] {
        // Channel types:
        // GUILD_TEXT GUILD_NEWS ThreadChannelTypes GUILD_CATEGORY GUILD_STAGE_VOICE GUILD_STORE GUILD_VOICE
        return Array.from(guild.channels.cache.filter(channel => channel.type === channeltype).values());
    }

    // https://stackoverflow.com/a/54369605
    public static visibleLength(str: string): number {
        return [...new Intl.Segmenter().segment(str)].length;
    }

    // https://stackoverflow.com/a/71619350
    public static getSegments(str: string): Intl.Segments {
        const segmenter = new Intl.Segmenter("en", {granularity: "word"});
        return segmenter.segment(str);
    }

    // Wraps words so blessed doesn't die when rendering emojis
    public static wordWrapToString(str: string, maxWidth: number): string {
        const lines: string[] = str.split("\n");
        let result = "";

        for (const line of lines) {
            const words: string[] = line.split(" ");
            let currentLine = "";

            for (const word of words) {
                const width: number = stringWidth(currentLine + word + " ");

                if (width > maxWidth) {
                    result += currentLine.trim() + "\n";
                    currentLine = word + " ";
                } else {
                    currentLine += word + " ";
                }
            }

            result += currentLine.trim() + " \n";
        }

        return result.trim();
    }
}
