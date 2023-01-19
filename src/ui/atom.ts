import AtomHandle from "./atomHandle.js";

export default abstract class Atom {
    protected readonly handle: AtomHandle;

    public constructor(handle: AtomHandle) {
        this.handle = handle;
    }
}
