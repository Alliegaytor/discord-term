import {Guild, TextChannel, Channel, GuildChannel} from "discord.js";

export default abstract class Utils {
    public static findDefaultChannel(guild: Guild): TextChannel {
        const result: TextChannel | undefined | null = guild.channels.cache.find((channel: Channel) => channel.type === "GUILD_TEXT"&& (channel as TextChannel).name.toLowerCase() === "general") as TextChannel;

        if (result) {
            return result;
        }

        const channels: GuildChannel[] = Array.from(guild.channels.cache.values()) as GuildChannel[];

        for (let i: number = 0; i < channels.length; i++) {
            if (channels[i].type === "GUILD_TEXT") {
                return channels[i] as TextChannel;
            }
        }

        throw new Error(`[Utils.findDefaultChannel] Guild '${guild.name}' does not contain any text channels`);
    }

    public static getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}
