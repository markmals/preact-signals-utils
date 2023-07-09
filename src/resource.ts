import { Signal as ReadonlySignal } from "@preact/signals"

interface Unresolved {
    state: ReadonlySignal<"unresolved">
    loading: ReadonlySignal<false>
    error: ReadonlySignal<undefined>
    latest: ReadonlySignal<undefined>
    get value(): undefined
}

interface Pending {
    state: ReadonlySignal<"pending">
    loading: ReadonlySignal<true>
    error: ReadonlySignal<undefined>
    latest: ReadonlySignal<undefined>
    get value(): undefined
}

interface Ready<Value> {
    state: ReadonlySignal<"ready">
    loading: ReadonlySignal<false>
    error: ReadonlySignal<undefined>
    latest: ReadonlySignal<Value>
    get value(): Value
}

interface Refreshing<Value> {
    state: ReadonlySignal<"refreshing">
    loading: ReadonlySignal<true>
    error: ReadonlySignal<undefined>
    latest: ReadonlySignal<Value>
    get value(): Value
}

interface Errored {
    state: ReadonlySignal<"errored">
    loading: ReadonlySignal<false>
    error: ReadonlySignal<unknown>
    latest: ReadonlySignal<never>
    get value(): never
}

export type ResourceActions<Key, Value> = {
    set value(newValue: Value)
    refetch(key?: Key): Value | Promise<Value> | undefined | null
}

export type Resource<Key, Value> = (
    | Unresolved
    | Pending
    | Ready<Value>
    | Refreshing<Value>
    | Errored
) &
    ResourceActions<Key, Value>

export type InitializedResource<Key, Value> = (Ready<Value> | Refreshing<Value> | Errored) &
    ResourceActions<Key, Value>

import { computed, effect, signal } from "@preact/signals"
import { useMemo } from "preact/hooks"

// TODO: Caching?

export function resource<Key, Value>(
    key: ReadonlySignal<Key>,
    fetcher: (key: Key) => Value | Promise<Value>
): Resource<Key, Value> {
    let resolved = false

    let promise: Promise<Value> | null = null

    const asyncValue = signal<Value | undefined>(undefined)
    const error = signal(undefined as unknown)
    const state = signal<"unresolved" | "pending" | "ready" | "refreshing" | "errored">(
        resolved ? "ready" : "unresolved"
    )

    const read = computed(() => {
        const v = asyncValue.value
        const err = error.value
        // FIXME: What happens when you throw inside a computed...?
        if (err !== undefined && !promise) throw err
        return v
    })

    function loadEnd(p: Promise<Value> | null, v: Value | undefined, error?: any) {
        if (promise === p) {
            promise = null
            resolved = true
            completeLoad(v, error)
        }
        return v
    }

    function completeLoad(v: Value | undefined, err: any) {
        if (err === undefined) asyncValue.value = v
        state.value = err !== undefined ? "errored" : "ready"
        error.value = err
    }

    function load(refetching: Key | boolean = true) {
        if (refetching !== false) return
        const p = fetcher(key.value)

        if (typeof p !== "object" || !(p && "then" in p)) {
            loadEnd(promise, p as Value, undefined)
            return p
        }

        promise = p

        state.value = resolved ? "refreshing" : "pending"

        return p.then(
            v => loadEnd(p, v, undefined),
            e => loadEnd(p, undefined, castError(e))
        ) as Promise<Value>
    }

    let resource = {} as Resource<Key, Value>

    Object.defineProperty(resource, "value", {
        get() {
            return read.value
        },
        set(newValue: Value) {
            asyncValue.value = newValue
        },
    })

    resource.state = computed(() => state.value) as Resource<Key, Value>["state"]
    resource.loading = computed(
        () => state.value === "pending" || state.value === "refreshing"
    ) as Resource<Key, Value>["loading"]
    resource.error = computed(() => error.value)
    resource.latest = computed(() => {
        if (!resolved) return read.value
        const err = error.value
        if (err && !promise) throw err
        return asyncValue.value
    }) as Resource<Key, Value>["latest"]

    resource.refetch = load

    effect(() => {
        load(false)
    })

    return resource
}

function castError(err: unknown): Error {
    if (err instanceof Error) return err
    return new Error(typeof err === "string" ? err : "Unknown error")
}

export function useResource<Key, Value>(
    key: ReadonlySignal<Key>,
    fetcher: (key: Key) => Value | Promise<Value>
): Resource<Key, Value> {
    return useMemo(() => resource(key, fetcher), [])
}
