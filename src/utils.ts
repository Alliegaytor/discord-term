import { Guild, TextChannel, Channel, GuildChannel, GuildBasedChannel, GuildManager, Permissions } from "discord.js";
import { UserId } from "./types.js";

export default abstract class Utils {
    public static findDefaultChannel(guild: Guild): TextChannel | null {
        const channels: TextChannel[] = Utils.getChannels(guild, "GUILD_TEXT") as TextChannel[];

        // Return null if there are no text channels
        if (channels.length === 0) {
            return null;
        }

        // Return the "general" chat ?? the first channel
        return channels.find((channel: TextChannel) => channel.name.toLowerCase() === "general") ?? channels[0]
    }

    public static getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    // Checks to see if client has permissions on a channel in an array
    public static permissionCheck(channel: TextChannel, userid: UserId, permissions: Array<bigint> ): Array<boolean> {
        const userperms = channel.permissionsFor(userid);
        const results: Array<boolean> = new Array(permissions.length);

        permissions.forEach((permission, i) => {
            if (userperms?.has(permission, true)) {
                results[i] = true;
            }
            else {
                results[i] = false;
            }
        })

        return results;
    }

    // Returns guilds client is in as Guild[]
    public static getGuilds(guilds: GuildManager): Guild[] {
        return Array.from(guilds.cache.values());
    }

    // Returns text channels in a server as GuildBasedChannel[]
    // TODO: Handle different kinds of channls
    public static getChannels(guild: Guild, channeltype: string): GuildBasedChannel[] {
        // Channel types:
        // GUILD_TEXT GUILD_NEWS ThreadChannelTypes GUILD_CATEGORY GUILD_STAGE_VOICE GUILD_STORE GUILD_VOICE
        return Array.from(guild.channels.cache.filter(channel => channel.type === channeltype).values());
    }
}
