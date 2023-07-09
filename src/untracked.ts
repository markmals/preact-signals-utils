import { Signal } from "@preact/signals"

let untracking = 0

export function untracked<T>(fn: () => T): T {
    untracking++
    let v = fn()
    untracking--
    return v
}

const { value, peek } = Object.getOwnPropertyDescriptors(Signal.prototype)

function alwaysConfigurable<T extends object>(source: T): T {
    const copy = {} as T

    Object.keys(source).forEach(key => {
        copy[key as keyof T] = source[key as keyof T]
    })

    return copy
}

// Without this we can't use Object.defineProperty on Signal.prototype.value,
// because it was set as non-configurable when it was created
Signal.prototype = alwaysConfigurable(Signal.prototype)

Object.defineProperty(Signal.prototype, "value", {
    get() {
        if (!untracking) {
            return value.get.apply(this)
        } else {
            return peek.value.apply(this)
        }
    },
    set(newValue) {
        if (!untracking) {
            value.set.call(this, newValue)
        } else {
            this.v = newValue
        }
    },
})
