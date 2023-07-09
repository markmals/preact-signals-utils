import { computed, effect, signal } from "@preact/signals"
import { describe, expect, test } from "vitest"
import { mapArray } from "../src"

describe("map operator", () => {
    test("simple mapArray", () => {
        // GIVEN: two signals (an array, and a computed array that doubles each element)
        const s = signal([1, 2, 3, 4])
        const r = computed(() => mapArray(s, v => v * 2).value)

        // EXPECT: the second array to be the doubled first array
        expect(r.value).toEqual([2, 4, 6, 8])

        s.value = [3, 4, 5]
        expect(r.value).toEqual([6, 8, 10])
    })

    test(
        "updates reactively",
        async () => {
            // GIVEN: two signals (an array, and a computed array that doubles each element)
            const s = signal([1, 2, 3, 4])
            const r = computed(() => mapArray(s, v => v * 2).value)

            let reactivity = new Promise<void>(resolve => {
                let count = 0

                // EXPECT: ...
                effect(() => {
                    if (count < 1) {
                        // the initial value of r to be initial s * 2
                        expect(r.value).toEqual([2, 4, 6, 8])
                        count++
                    } else {
                        // the final value of r to be the second vlaue of s * 2
                        expect(r.value).toEqual([6, 8, 10])
                        resolve()
                    }
                })
            })

            // WHEN: s.value changes
            s.value = [3, 4, 5]

            await reactivity
        },
        { timeout: -1 }
    )

    // TODO: Implement fallback
    // test("show fallback", () => {
    //     const s = signal([1, 2, 3, 4])
    //     const double = mapArray<number, number | string>(s, v => v * 2, {
    //         fallback: () => "Empty",
    //     })
    //     const r = computed(() => double.value)

    //     expect(r.value).toEqual([2, 4, 6, 8])
    //     s.value = []
    //     expect(r.value).toEqual(["Empty"])
    //     s.value = [3, 4, 5]
    //     expect(r.value).toEqual([6, 8, 10])
    // })
})

// TODO: Implement indexArray
// describe("index operator", () => {
//     test("simple indexArray", () => {
//         const s = signal([1, 2, 3, 4])
//         const r = computed(() => indexArray(s, v => v.value * 2).value)

//         expect(r.value).toEqual([2, 4, 6, 8])
//     })

//     test("show fallback", () => {
//         const s = signal([1, 2, 3, 4])
//         const double = indexArray<number, number | string>(s, v => v.value * 2, {
//             fallback: () => "Empty",
//         })
//         const r = computed(() => double.value)

//         expect(r.value).toEqual([2, 4, 6, 8])
//         s.value = []
//         expect(r.value).toEqual(["Empty"])
//         s.value = [3, 4, 5]
//         expect(r.value).toEqual([6, 8, 10])
//     })
// })
