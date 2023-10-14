import { computed, effect, signal } from "@preact/signals"
import { describe, expect, test } from "vitest"
import { mapArray } from "../src"

describe("map operator", () => {
    test("simple mapArray", () => {
        // GIVEN: two signals (an array, and a computed array that doubles each element)
        const s = signal([1, 2, 3, 4])
        const r = computed(() => mapArray(s, v => v * 2).value)

        // Set up reactivity -> synchronous var transformer
        let arr: number[] = []
        effect(() => (arr = r.value))

        // EXPECT: ...
        // the initial value of r to be initial s * 2
        expect(arr).toEqual([2, 4, 6, 8])

        // WHEN: s.value changes
        s.value = [3, 4, 5]

        // EXPECT: ...
        // the final value of r to be the second vlaue of s * 2
        expect(arr).toEqual([6, 8, 10])
    })

    test("mapArray caches objects and retains object identity", () => {
        const s = signal([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }])
        const r = mapArray(s, v => ({ id: v.id * 2 }))

        const initial = r.value[0]

        const newIdentity = { id: 2 }
        expect(newIdentity.id === initial.id).toBeTruthy()
        expect(newIdentity === initial).toBeFalsy()

        s.value = [...s.value.slice(0, 2)]
        const newValue = r.value[0]
        expect(initial === newValue).toBeTruthy()

        s.value = [...s.value, { id: 5 }]
        expect(initial === r.value[0]).toBeTruthy()
        expect(newValue === r.value[0]).toBeTruthy()
    })

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
