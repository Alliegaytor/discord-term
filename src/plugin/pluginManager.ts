import fs from "fs";
import path from "path";
import App from "../app.js";

export default class PluginManager {
    protected readonly app: App;

    public constructor(app: App) {
        this.app = app;
    }

    public async loadAll(): Promise<number> {
        const loaded = 0;

        if (fs.existsSync(this.app.options.pluginsPath)) {
            const pluginFolders = new Set<string>();

            await new Promise<void>((resolve) => {
                fs.readdir(this.app.options.pluginsPath, (error: Error | null, folders: string[]) => {
                    for (const folder of folders) {
                        pluginFolders.add(folder);
                    }

                    resolve();
                });
            });

            for (const pluginFolder of pluginFolders) {
                const entryPath: string = path.join(pluginFolder, "index.js");

                // Ensure entry file exists.
                if (fs.existsSync(entryPath)) {
                    // Require/load the plugin's entry file.
                    // let plugin = require(entryPath);
                    //
                    // // Support for ES5+ (default exports).
                    // if (plugin.default !== undefined) {
                    //     plugin = plugin.default;
                    // }

                    // TODO: Continue.
                }
            }
        }

        return loaded;
    }
}
