import { ReadonlySignal, useComputed } from "@preact/signals"
import { ComponentChild, ComponentChildren, Fragment, JSX } from "preact"

export namespace Show {
    export interface Props<T> {
        when: ReadonlySignal<T | undefined | null | false>
        fallback?: ComponentChild
        children: ComponentChildren
    }
}

/**
 * Conditionally render its children or an optional fallback component
 */
export function Show<T>({ when, fallback, children }: Show.Props<T>): JSX.Element {
    const value = useComputed(() => {
        if (when.value) {
            return children
        }

        return fallback
    })

    return <Fragment>{value}</Fragment>
}

// TODO: Switch: https://github.com/solidjs/solid/blob/main/packages/solid/src/render/flow.ts#L160
