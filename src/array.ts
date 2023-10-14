import { ReadonlySignal, computed, signal, untracked } from "@preact/signals"

/**
 * Reactively transforms an array with a callback function - underlying helper for the `<For>` control flow
 *
 * Similar to `Array.prototype.map`, but gets the index as a signal, transforms only values that changed and returns a readonly signal and reactively tracks changes to the list.
 */
export function mapArray<Element, Result>(
    list: ReadonlySignal<Element[]>,
    mapFn: (value: Element, index: ReadonlySignal<number>) => Result
): ReadonlySignal<Result[]> {
    let items: Element[] = []
    let mapped: Result[] = []
    let len = 0
    let indexes: ((v: number) => number)[] | null = mapFn.length > 1 ? [] : null

    return computed(() => {
        let newItems = list.value || []
        let i: number
        let j: number
        //   (newItems as any)[$TRACK] // top level tracking
        return untracked(() => {
            let newLen = newItems.length,
                newIndices: Map<Element, number>,
                newIndicesNext: number[],
                temp: Result[],
                tempIndexes: ((v: number) => number)[],
                start: number,
                end: number,
                newEnd: number,
                item: Element

            // fast path for empty arrays
            if (newLen === 0) {
                if (len !== 0) {
                    items = []
                    mapped = []
                    len = 0
                    indexes && (indexes = [])
                }
                //   if (options.fallback) {
                //       items = [FALLBACK]
                //       mapped[0] = createRoot(disposer => {
                //           return options.fallback!()
                //       })
                //       len = 1
                //   }
            }
            // fast path for new create
            else if (len === 0) {
                mapped = new Array(newLen)
                for (j = 0; j < newLen; j++) {
                    items[j] = newItems[j]
                    mapped[j] = mapper()
                }
                len = newLen
            } else {
                temp = new Array(newLen)
                indexes && (tempIndexes = new Array(newLen))

                // skip common prefix
                for (
                    start = 0, end = Math.min(len, newLen);
                    start < end && items[start] === newItems[start];
                    start++
                );

                // common suffix
                for (
                    end = len - 1, newEnd = newLen - 1;
                    end >= start && newEnd >= start && items[end] === newItems[newEnd];
                    end--, newEnd--
                ) {
                    temp[newEnd] = mapped[end]
                    indexes && (tempIndexes![newEnd] = indexes[end])
                }

                // 0) prepare a map of all indices in newItems, scanning backwards so we encounter them in natural order
                newIndices = new Map<Element, number>()
                newIndicesNext = new Array(newEnd + 1)
                for (j = newEnd; j >= start; j--) {
                    item = newItems[j]
                    i = newIndices.get(item)!
                    newIndicesNext[j] = i === undefined ? -1 : i
                    newIndices.set(item, j)
                }
                // 1) step through all old items and see if they can be found in the new set; if so, save them in a temp array and mark them moved; if not, exit them
                for (i = start; i <= end; i++) {
                    item = items[i]
                    j = newIndices.get(item)!
                    if (j !== undefined && j !== -1) {
                        temp[j] = mapped[i]
                        indexes && (tempIndexes![j] = indexes[i])
                        j = newIndicesNext[j]
                        newIndices.set(item, j)
                    }
                }
                // 2) set all the new values, pulling from the temp array if copied, otherwise entering the new value
                for (j = start; j < newLen; j++) {
                    if (j in temp) {
                        mapped[j] = temp[j]
                        if (indexes) {
                            indexes[j] = tempIndexes![j]
                            indexes[j](j)
                        }
                    } else mapped[j] = mapper()
                }
                // 3) in case the new set is shorter than the old, set the length of the mapped array
                mapped = mapped.slice(0, (len = newLen))
                // 4) save a copy of the mapped items for the next update
                items = newItems.slice(0)
            }
            return mapped
        })

        function mapper() {
            if (indexes) {
                const s = signal(j)
                const set = (v: number) => (s.value = v)
                indexes[j] = set
                return mapFn(newItems[j], s)
            }

            return (mapFn as any)(newItems[j])
        }
    })
}

// TODO: indexArray: https://github.com/solidjs/solid/blob/main/packages/solid/src/reactive/array.ts#L184
