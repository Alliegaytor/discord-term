#!/usr/bin/env node

console.log("Initializing interface ...");

import App from "./app.js";

const app: App = new App();

try {
    await app.setup();
}
catch (error: unknown) {
    console.log(error);
}
