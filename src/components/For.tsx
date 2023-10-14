import { ReadonlySignal } from "@preact/signals"
import { ComponentChildren } from "preact"
import { useMemo } from "preact/hooks"
import { Fragment, JSX } from "preact/jsx-runtime"
import { mapArray } from "../array"

export type SignalChildrenElementType = JSX.ElementType<{
    children: JSX.SignalLike<ComponentChildren> | ComponentChildren
}>

export namespace For {
    export interface Props<T, Element extends SignalChildrenElementType> {
        each: ReadonlySignal<T[]>
        children(item: T): ComponentChildren
        as?: Element
    }
}

/**
 * Creates a list elements from a list
 *
 * It receives a map function as its child that receives a list element and an accessor with the index and returns a JSX.Element; if the list is empty, an optional fallback is returned:
 * ```tsx
 * <For each={items} fallback={<div>No items</div>}>
 *   {(item, index) => <div data-index={index}>{item}</div>}
 * </For>
 * ```
 * If you have a list with fixed indices and changing values, consider using `<Index>` instead.
 */
export function For<T, Element extends SignalChildrenElementType = typeof Fragment>({
    each,
    children,
    as: Element,
}: For.Props<T, Element>) {
    // TODO: Automatically key each child
    const childSignal = useMemo(() => mapArray(each, children), [])
    const Wrapper = (Element as any) || Fragment
    return <Wrapper>{childSignal.value}</Wrapper>
}

// TODO: <Index /> : https://github.com/solidjs/solid/blob/main/packages/solid/src/render/flow.ts#L64
