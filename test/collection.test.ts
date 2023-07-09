import { effect } from "@preact/signals"
import { beforeEach, describe, expect, test } from "vitest"
import { Collection, Identifiable, collection } from "../src/collection"
import { MemoryStorageEngine } from "../src/storage-engines"

class BoutiqueItem implements Identifiable {
    constructor(public id: string, public value: string) {}

    static coat = new BoutiqueItem("1", "Coat")
    static sweater = new BoutiqueItem("2", "Sweater")
    static purse = new BoutiqueItem("3", "Purse")
    static belt = new BoutiqueItem("4", "Belt")
    static duplicateBelt = new BoutiqueItem("4", "Belt")

    static allItems = [
        BoutiqueItem.coat,
        BoutiqueItem.sweater,
        BoutiqueItem.purse,
        BoutiqueItem.belt,
        BoutiqueItem.duplicateBelt,
    ]

    static uniqueItems = [
        BoutiqueItem.coat,
        BoutiqueItem.sweater,
        BoutiqueItem.purse,
        BoutiqueItem.belt,
    ]
}

let items: Collection<BoutiqueItem>

describe("collections", () => {
    beforeEach(() => {
        // Mock using the MemoryStorageEngine for testing in a non-browser environment
        items = collection<BoutiqueItem>({ storage: new MemoryStorageEngine("Tests") })
        items.clear()
    })

    describe("adding items", () => {
        test("adding an item", () => {
            items.add(BoutiqueItem.coat)
            expect(items.value.includes(BoutiqueItem.coat)).toBeTruthy()

            items.add(BoutiqueItem.belt)
            expect(items.value.includes(BoutiqueItem.belt)).toBeTruthy()
            expect(items.value.length).toEqual(2)
        })

        test("adding multiple items", () => {
            items.add([
                BoutiqueItem.coat,
                BoutiqueItem.sweater,
                BoutiqueItem.sweater,
                BoutiqueItem.purse,
            ])
            expect(items.value.includes(BoutiqueItem.coat)).toBeTruthy()
            expect(items.value.includes(BoutiqueItem.sweater)).toBeTruthy()
            expect(items.value.includes(BoutiqueItem.purse)).toBeTruthy()
        })

        test("adding duplicate items", () => {
            expect(items.value.length).toEqual(0)
            items.add(BoutiqueItem.allItems)
            expect(items.value.length).toEqual(4)
        })
    })

    test("reading items", () => {
        items.add(BoutiqueItem.allItems)

        expect(items.value[0]).toEqual(BoutiqueItem.coat)
        expect(items.value[1]).toEqual(BoutiqueItem.sweater)
        expect(items.value[2]).toEqual(BoutiqueItem.purse)
        expect(items.value[3]).toEqual(BoutiqueItem.belt)

        expect(items.value.length).toEqual(4)
    })

    test("deleting items", () => {
        items.add(BoutiqueItem.allItems)
        items.delete(BoutiqueItem.coat)

        expect(items.value.includes(BoutiqueItem.coat)).toBeFalsy()

        expect(items.value.includes(BoutiqueItem.sweater)).toBeTruthy()
        expect(items.value.includes(BoutiqueItem.purse)).toBeTruthy()

        items.delete([BoutiqueItem.sweater, BoutiqueItem.purse])

        expect(items.value.includes(BoutiqueItem.sweater)).toBeFalsy()
        expect(items.value.includes(BoutiqueItem.purse)).toBeFalsy()
    })

    test("clearing items", () => {
        items.add(BoutiqueItem.coat)
        expect(items.value.length).toEqual(1)
        items.clear()
        expect(items.value.length).toEqual(0)

        items.add(BoutiqueItem.uniqueItems)
        expect(items.value.length).toEqual(4)
        items.clear()
        expect(items.value.length).toEqual(0)
    })

    // FIXME: Test not passing
    test(
        "reactivity",
        async () => {
            let uniqueItems = BoutiqueItem.uniqueItems

            let basicReactivity = new Promise<void>(resolve => {
                let count = 0

                effect(() => {
                    if (count < 1) {
                        // Initial store load
                        expect(items.value.length).toEqual(0)
                        count++
                    } else {
                        // After store#add is called
                        expect(items.value).toEqual(uniqueItems)
                        resolve()
                    }
                })
            })

            let isEmptyReactivity = new Promise<void>(resolve => {
                let count = 0

                effect(() => {
                    if (count === 0) {
                        // Initial store load
                        expect(items.isEmpty.value).toEqual(true)
                        count++
                    } else {
                        // After store#add is called
                        expect(items.isEmpty.value).toEqual(false)
                        resolve()
                    }
                })
            })

            expect(items.value.length).toEqual(0)
            items.add(uniqueItems)
            await Promise.all([basicReactivity, isEmptyReactivity])
        },
        { timeout: 500 }
    )
})
