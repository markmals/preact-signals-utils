import { ReadonlySignal, Signal, computed, effect, signal } from "@preact/signals"
import { useMemo } from "preact/hooks"

export type Selector<U> = (key: U) => ReadonlySignal<boolean>

// TODO: Make sure this is actually O(1) instead of O(n)

/**
 * Creates a conditional signal that only notifies subscribers when entering or
 * exiting their key matching the value. Useful for delegated selection state,
 * as it makes the operation O(1) instead of O(n).
 *
 * @param source
 * @param equals a function that receives its previous or the initial value, if set, and returns a new value used to react on a computation
 * @returns the selector function
 *
 * @example
 * ```tsx
 *   const list = useSignal<{ id: number; name: string }[]>([])
 *   const selected = useSignal<number | null>(null)
 *   const isSelected = useSelector(selected)
 *
 *   return (
 *       <For each={list} as={"ul"}>
 *           {item => {
 *               const className = computed(() =>
 *                  isSelected(item.id).value ? "active" : ""
 *               )
 *               return (
 *                  <li
 *                      class={className}
 *                      onClick={() => (selected.value = item.id)}
 *                  >
 *                      {item.name}
 *                  </li>
 *               )
 *           }}
 *       </For>
 *   )
 * ```
 */
export function selector<T, U extends T>(
    source: ReadonlySignal<T>,
    equals: (a: U, b: T) => boolean = (a, b) => a === b
): Selector<U> {
    let subscriptions = new Map<U, Signal<U | undefined | null>>()
    let value: T

    effect(() => {
        value = source.value

        for (const key of [...subscriptions.keys()]) {
            const o = subscriptions.get(key)
            o.value = equals(key, value) ? (value as U) : null
        }
    })

    return (key: U) =>
        computed(() => {
            type Tracker = (Signal<U | undefined | null> & { _count?: number }) | undefined
            let tracker: Tracker = subscriptions.get(key)

            if (!tracker) {
                tracker = signal(undefined)
                subscriptions.set(key, tracker)
            }

            tracker.value

            if (tracker._count) {
                tracker._count++
            } else {
                tracker._count = 1
            }

            if (tracker._count > 1) {
                tracker._count--
            }

            return equals(key, value)
        })
}

export function useSelector<T, U extends T>(
    source: ReadonlySignal<T>,
    fn: (a: U, b: T) => boolean = (a, b) => a === b
): Selector<U> {
    return useMemo(() => selector(source, fn), [])
}
