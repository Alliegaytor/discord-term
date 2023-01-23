import { Guild, TextChannel, Channel, ChannelType, GuildChannel, GuildBasedChannel, GuildManager, PermissionsBitField } from "discord.js";
import { UserId } from "./types.js";
import stringWidth from "string-width";

export default abstract class Utils {
    public static findDefaultChannel(guild: Guild): TextChannel | null {
        const channels: TextChannel[] = Utils.getChannels(guild, ChannelType.GuildText) as TextChannel[];

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
        const userperms = channel.permissionsFor(userid) as Readonly<PermissionsBitField>;
        const results: Array<boolean> = new Array(permissions.length);

        permissions.forEach((permission, i) => {
            if (userperms.has(permission, true)) {
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
    public static getChannels(guild: Guild, channeltype: ChannelType): GuildBasedChannel[] {
        // Channel types:
        // GUILD_TEXT GUILD_NEWS ThreadChannelTypes GUILD_CATEGORY GUILD_STAGE_VOICE GUILD_STORE GUILD_VOICE
        return Array.from(guild.channels.cache.filter(channel => channel.type === channeltype).values());
    }

    // https://stackoverflow.com/a/54369605
    public static visibleLength(str: string): number {
        return [...new Intl.Segmenter().segment(str)].length
    }

    // https://stackoverflow.com/a/71619350
    public static getSegments(str: string): Intl.Segments {
        const segmenter = new Intl.Segmenter("en", {granularity: "word"});
        return segmenter.segment(str)
    }

    // Wraps words so blessed doesn't die when rendering emojis
    public static wordWrapToStringList (text: string, maximumWidth: number): Array<string> {
          let result: Array<string> = [], line: Array<string> = [];
          let length: number = 0;

          text.split(" ").forEach((word) => {
              // If word is bigger than the maximumWidth
              if (stringWidth(word) >= maximumWidth && stringWidth(word) != word.length) {
                  let newWord: string = word;
                  // Shrink the word
                  function shrink(str: string): string {
                      let newWord: string = str;
                      // Cut text if it's a very long word
                      while (stringWidth(newWord) + 2 >= maximumWidth) {
                        newWord = newWord.slice(0, -1);
                      }
                      result.push(newWord);
                      newWord = str.replace(newWord, "");
                      return newWord
                  }

                  while (stringWidth(newWord) > maximumWidth) {
                      newWord = shrink(newWord)
                  }

                  result.push(newWord);
                  newWord = word.replace(newWord, "");
              }
              // If word is not bigger than maximumWidth
              else {
                  if ((length + stringWidth(word)) >= maximumWidth) {
                      result.push(line.join(" "));
                      line = []; length = 0;
                  }
                  length += stringWidth(word) + 1;
                  line.push(word);
              }
          })

          if (line.length > 0) {
              result.push(line.join(" "));
          }

          return result;
    }
}
