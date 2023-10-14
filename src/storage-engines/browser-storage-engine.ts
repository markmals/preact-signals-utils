import { StorageEngine } from "./storage-engine"

export class BrowserStorageEngine<Item> extends StorageEngine<Item> {
    public constructor(prefix: string, protected storage: Storage = localStorage) {
        super(prefix)
    }

    public get keys() {
        return Object.keys(this.storage).filter(key => key.startsWith(this.prefix))
    }

    public get(): Item[]
    public get(key: string): Item
    public get(key?: string): Item | Item[] {
        if (key) {
            return JSON.parse(this.storage.getItem(this.prefixKey(key)) ?? "")
        }

        return this.keys.map(key => this.get(key))
    }

    public set(key: string, value: Item) {
        this.storage.setItem(this.prefixKey(key), JSON.stringify(value))
    }

    public delete(key: string) {
        this.storage.removeItem(this.prefixKey(key))
    }

    public clear() {
        for (const key of this.keys) {
            this.delete(key)
        }
    }
}
