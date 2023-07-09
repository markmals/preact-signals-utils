import { StorageEngine } from "./storage-engine"

export class MemoryStorageEngine<Item> extends StorageEngine<Item> {
    private memory = new Map<string, Item>()

    public constructor(prefix: string) {
        super(prefix)
    }

    public get keys() {
        return Array.from(this.memory.keys())
    }

    public get(): Item[]
    public get(key: string): Item
    public get(key?: string): Item | Item[] {
        if (key) {
            return this.memory.get(this.prefixKey(key))!
        }

        return this.keys.map(key => this.get(key))
    }

    public set(key: string, value: Item) {
        this.memory.set(this.prefixKey(key), value)
    }

    public delete(key: string) {
        this.memory.delete(this.prefixKey(key))
    }

    public clear() {
        this.memory.clear()
    }
}
