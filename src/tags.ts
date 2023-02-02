import State from "./state/state.js";

export default class Tags {
    protected readonly state: State;

    public constructor(state: State) {
        this.state = state;
    }

    public getAll(): string[] {
        return Object.keys(this.state.get().tags);
    }

    public has(name: string): boolean {
        const { tags } = this.state.get();
        return Object.prototype.hasOwnProperty.call(tags, name);
    }

    public get(name: string): string  {
        const { tags } = this.state.get();
        return tags[name];
    }

    public set(name: string, value: string): this {
        this.state.get().tags[name] = value;
        return this;
    }

    public delete(name: string): boolean {
        const { tags } = this.state.get();
        if (this.has(name)) {
            delete tags[name];
            return true;
        }

        return false;
    }
}
