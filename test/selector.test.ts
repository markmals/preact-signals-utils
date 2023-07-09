import { computed, signal } from "@preact/signals"
import { describe, expect, test } from "vitest"
import { selector } from "../src"

// https://github.com/solidjs/solid/blob/main/packages/solid/test/signals.spec.ts#LL610C1-L710C4

describe("createSelector", () => {
    test("simple selection", () => {
        const s = signal<number | null>(null)
        const isSelected = selector(s)

        let count = 0

        const list = Array.from({ length: 100 }, (_, i) =>
            computed(() => {
                count++
                return isSelected(i).value ? "selected" : "no"
            })
        )

        // Preact's computeds/effects aren't eager
        // expect(count).toBe(100)
        expect(list[3].value).toBe("no")

        count = 0
        s.value = 3
        expect(count).toBe(1)
        expect(list[3].value).toBe("selected")
        count = 0
        s.value = 6
        expect(count).toBe(2)
        expect(list[3].value).toBe("no")
        expect(list[6].value).toBe("selected")
        s.value = null
        expect(count).toBe(3)
        expect(list[6].value).toBe("no")
        s.value = 5
        expect(count).toBe(4)
        expect(list[5].value).toBe("selected")
    })

    test("double selection", () =>
        new Promise(done => {
            const s = signal(-1)
            const isSelected = selector(s)

            let count = 0

            const list = Array.from({ length: 100 }, (_, i) => [
                computed(() => {
                    count++
                    return isSelected(i).value ? "selected" : "no"
                }),
                computed(() => {
                    count++
                    return isSelected(i).value ? "oui" : "non"
                }),
            ])

            // Preact's computeds/effects aren't eager
            // expect(count).toBe(200)
            expect(list[3][0].value).toBe("no")
            expect(list[3][1].value).toBe("non")

            count = 0
            s.value = 3
            expect(count).toBe(2)
            expect(list[3][0].value).toBe("selected")
            expect(list[3][1].value).toBe("oui")
            count = 0
            s.value = 6
            expect(count).toBe(4)
            expect(list[3][0].value).toBe("no")
            expect(list[6][0].value).toBe("selected")
            expect(list[3][1].value).toBe("non")
            expect(list[6][1].value).toBe("oui")
            done(undefined)
        }))

    test("zero index", () =>
        new Promise(done => {
            const s = signal(-1)
            const isSelected = selector(s)

            let count = 0

            const list = [
                computed(() => {
                    count++
                    return isSelected(0).value ? "selected" : "no"
                }),
            ]

            // Preact's computeds/effects aren't eager
            // expect(count).toBe(1)
            expect(list[0].value).toBe("no")

            count = 0
            s.value = 0
            expect(count).toBe(1)
            expect(list[0].value).toBe("selected")
            count = 0
            s.value = -1
            expect(count).toBe(1)
            expect(list[0].value).toBe("no")
            done(undefined)
        }))
})
