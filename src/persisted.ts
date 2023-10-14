import { Signal, effect, signal } from "@preact/signals"
import { useMemo } from "preact/hooks"
import { BrowserStorageEngine, StorageEngine } from "./storage-engines"

export function persistedSignal<T>(
    initialValue: T,
    key: string,
    storage: StorageEngine<T> = new BrowserStorageEngine(key)
): Signal<T> {
    let instance = signal(initialValue)
    let skipSave = true

    // try to hydrate state from storage:
    function load() {
        skipSave = true
        try {
            const stored = storage.get(key)
            if (stored != null) instance.value = stored
        } catch (err) {
            // ignore blocked storage access
        }
        skipSave = false
    }

    effect(() => {
        let value = instance.value
        if (skipSave) return
        try {
            storage.set(key, value)
        } catch (err) {
            // ignore blocked storage access
        }
    })

    // if another tab changes the launch tracking state, update our in-memory copy:
    if (typeof addEventListener === "function") {
        addEventListener("storage", event => {
            if (event.key === key) load()
        })
    }

    load()
    return instance
}

export function usePersistedSignal<T>(
    initialValue: T,
    key: string,
    storage: StorageEngine<T> = new BrowserStorageEngine(key)
): Signal<T> {
    return useMemo(() => persistedSignal(initialValue, key, storage), [])
}
