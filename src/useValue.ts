import { Signal, useSignal } from "@preact/signals"

/**
 * Returns a signal that is updated every time the component is rerendered with
 * a different value for `value`.
 *
 * @example
 * Useful for:
 * ```ts
 * let a = useValue(props.a)
 * let hookValue = useSomeOtherHook()
 * let b = useValue(hookValue)
 * useSignalEffect(() => console.log(a.value + b.value))
 * ```
 */
export function useValue<T>(value: T): Signal<T> {
    let instance = useSignal(value)
    if (instance.peek() !== value) instance.value = value
    return instance
}
