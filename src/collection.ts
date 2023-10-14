import { Signal, computed, signal } from "@preact/signals"
import { useMemo } from "preact/hooks"
import { JSX } from "preact/jsx-runtime"
import { StorageEngine } from "./storage-engines/storage-engine"

export interface ToString {
    toString(): string
}

export interface Identifiable {
    id: ToString
}

interface _CollectionOptions<Element> {
    storage: StorageEngine<Element>
    cacheIdentifier: keyof Element | undefined
    initialValue: Element[] | undefined
}

export type CollectionOptions<Element> = Element extends Identifiable
    ? {
          storage: StorageEngine<Element>
          initialValue?: Element[]
      }
    : {
          storage: StorageEngine<Element>
          cacheIdentifier: keyof Element
          initialValue?: Element[]
      }

export class Collection<Element> implements JSX.SignalLike<Element[]> {
    private elements: Signal<Element[]> = signal([])
    private storageEngine: StorageEngine<Element>
    private cacheId: keyof Element

    constructor(options: CollectionOptions<Element>) {
        const { initialValue, storage, cacheIdentifier } = options as _CollectionOptions<Element>

        if (initialValue !== undefined) {
            this.elements.value = initialValue
        } else {
            // Populate the state with any existing database data
            let items = storage.get()
            if (items) {
                this.elements.value = items
            }
        }

        this.storageEngine = storage
        this.cacheId = cacheIdentifier || ("id" as keyof Element)
    }

    public get value() {
        return this.elements.value
    }

    public isEmpty = computed(() => this.elements.value.length === 0)

    public add(item: Element | Element[]) {
        let currentValuesMap = new Map<string, Element>()

        if (Array.isArray(item)) {
            let addedItemsMap = new Map<string, Element>()

            // Deduplicate items passed into `add(items)` by taking advantage
            // of the fact that a Map can't have duplicate keys.
            for (let newItem of item) {
                let identifier = newItem[this.cacheId].toString()
                addedItemsMap.set(identifier, newItem)
            }

            // Take the current items array and turn it into a Map.
            for (let currentItem of this.elements.peek()) {
                currentValuesMap.set(currentItem[this.cacheId].toString(), currentItem)
            }

            // Add the new items into the dictionary representation of our items.
            for (let [key, newItem] of addedItemsMap) {
                currentValuesMap.set(key, newItem)
            }

            // We persist only the newly added items, rather than rewriting all of the items
            this.persist(Array.from(addedItemsMap.values()))
        } else {
            let identifier = item[this.cacheId].toString()

            for (let currentItem of this.elements.peek()) {
                currentValuesMap.set(currentItem[this.cacheId].toString(), currentItem)
            }

            currentValuesMap.set(identifier, item)

            // We persist only the newly added item, rather than rewriting all of the items
            this.persist(item)
        }

        this.elements.value = Array.from(currentValuesMap.values())
    }

    public delete(item: Element | Element[]) {
        let values: Element[] = Array.isArray(item) ? item : [item]
        this.deletePersisted(item)
        this.elements.value = this.elements.value.filter(
            currentItem =>
                !values
                    .map(i => String(i[this.cacheId]))
                    .includes(currentItem[this.cacheId].toString())
        )
    }

    public clear() {
        this.storageEngine.clear()
        this.elements.value = []
    }

    private persist(item: Element | Element[]) {
        if (Array.isArray(item)) {
            let items = item
            for (const item of items) {
                this.persist(item)
            }
        } else {
            let identifier = item[this.cacheId].toString()
            this.storageEngine.set(identifier, item)
        }
    }

    private deletePersisted(item: Element | Element[]) {
        if (Array.isArray(item)) {
            let items = item
            for (const item of items) {
                this.deletePersisted(item)
            }
        } else {
            let identifier = item[this.cacheId].toString()
            this.storageEngine.delete(identifier)
        }
    }

    // MARK: Signal API

    public peek(): Element[] {
        return this.elements.peek()
    }

    public subscribe(fn: (value: Element[]) => void): () => void {
        return this.elements.subscribe(fn)
    }
}

export function collection<Element>(options: CollectionOptions<Element>): Collection<Element> {
    return new Collection(options)
}

export function useCollection<Element>(
    c: CollectionOptions<Element> | Collection<Element>
): Collection<Element> {
    return useMemo(() => (c instanceof Collection ? c : collection(c)), [])
}

// interface Database {
//     collection<T>(name: string): Database.Collection<T>
// }

// namespace Database {
//     export interface Collection<T> {
//         find(): Promise<T>
//     }
// }

// TODO: Add more of a database/Mongo/Firebase API?

// const myDB = client.db("myDB")
// const myColl = myDB.collection("pizzaMenu")

// const findResult = await myColl.find({
//     name: "Pepperoni pizza",
//     date: {
//         $gte: new Date(new Date().setHours(00, 00, 00)),
//         $lt: new Date(new Date().setHours(23, 59, 59)),
//     },
// })

// const doc = { name: "Neapolitan pizza", shape: "round" }
// const result = await myColl.insertOne(doc)

//  const docs = [
//      { _id: 1, color: "red" },
//      { _id: 2, color: "purple" },
//      { _id: 1, color: "yellow" },
//      { _id: 3, color: "blue" },
//  ]
//  const insertManyresult = await myColl.insertMany(docs)
//  let ids = insertManyresult.insertedIds

// const deleteResult = await myColl.deleteOne(doc)
// const deleteManyResult = await myColl.deleteMany(doc)

// const filter = { _id: 465 }
// // update the value of the 'quantity' field to 5
// const updateDocument = {
//     $set: {
//         quantity: 5,
//     },
// }
// const result = await myColl.updateOne(filter, updateDocument)

// const filter = { _id: 501 }
// // replace the matched document with the replacement document
// const replacementDocument = {
//     item: "Vintage silver flatware set",
//     price: 79.15,
//     quantity: 1,
// }
// const result = await myColl.replaceOne(filter, replacementDocument)
