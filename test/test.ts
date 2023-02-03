import State from "../src/state/state.js";
import "../src/state/stateConstants.js";
import App from "../src/app.js";


export const app: App = new App();
export const state: State = new State(app, app.options);


import "./wordwrapstring_test.js";
import "./tag_test.js";

// app.message.system("hi");
