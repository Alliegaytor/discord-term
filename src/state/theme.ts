import { ForegroundColorName } from "chalk";

export interface IThemes {
    messages: IThemeMessages;
    channels: IThemeChannels;
    servers: IThemeServers;
    input: IThemeInput;
    header: IThemeHeader;
}

export interface IThemeMessages {
    foregroundColor: ForegroundColorName;
    backgroundColor: string;
}

export interface IThemeChannels {
    foregroundColor: string;
    backgroundColor: string;
    foregroundColorHover: string;
    backgroundColorHover: string;
}

export interface IThemeServers {
    foregroundColor: string;
    backgroundColor: string;
    foregroundColorHover: string;
    backgroundColorHover: string;
}

export interface IThemeInput {
    foregroundColor: string;
    backgroundColor: string;
}

export interface IThemeHeader {
    foregroundColor: string;
    backgroundColor: string;
}

// TODO: Automatically create array of keys from interface rather than hard-coding it
export const expectedThemeKeys: (keyof IThemes)[] = [
    "messages",
    "channels",
    "servers",
    "input",
    "header"
];