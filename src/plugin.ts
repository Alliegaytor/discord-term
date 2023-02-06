import App from "./app.js";

export interface Plugin {
    readonly name: string;

    readonly description?: string;

    readonly version: string;

    readonly author?: string;

    enabled(app: App): void;

    disabled(app: App): void;
}
