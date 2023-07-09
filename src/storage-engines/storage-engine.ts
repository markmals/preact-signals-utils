export abstract class StorageEngine<Item> {
    private _prefix: string

    public constructor(prefix: string) {
        this._prefix = prefix
    }

    protected get prefix(): string {
        return `${this._prefix}:`
    }

    protected prefixKey(key: string): string {
        return key.startsWith(this.prefix) ? key : `${this.prefix}${key}`
    }

    public abstract readonly keys: string[]
    public abstract get(): Item[]
    public abstract get(key: string): Item
    public abstract set(key: string, value: Item): void
    public abstract delete(key: string): void
    public abstract clear(): void
}
