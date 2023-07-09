# Preact Signals Utilities

Reactive utilities for `@preact/signals`. Inspired by the various signal utilities included with [Solid.js](https://www.solidjs.com/docs/latest/api).

## Installation

```sh
# npm
npm install preact-signals-utils

# yarn
yarn add preact-signals-utils

# pnpm
pnpm install preact-signals-utils
```

## Usage

### `resource`

```ts
import { signal } from "@preact/signals"
import { resource } from "preact-signals-utils"

const characterID = signal(1)

async function fetchUser(id: number): Promise<Character> {
    let data = await fetch(`https://swapi.dev/api/people/${id}/`)
    let json = await data.json()
    return { id, ...json }
}

const character = resource(characterID, fetchUser)

character.value // Character | undefined | never
character.loading.value // boolean
character.error.value // unknown | undefined
character.latest.value // Character | undefined | never
character.state.value // "unresolved" | "pending" | "ready" | "refreshing" | "errored"
character.refetch(/* options?: { key: Key } */)
```

### `collection`

```ts
import { Identifiable, collection, BrowserStorageEngine } from "preact-signals-utils"

interface Character extends Identifiable { ... }

const characters = collection<Character>({
    storage: new BrowserStorageEngine({ path: "characters" }), // StorageEngine
    // initialValue?: Character[]
})

characters.isEmpty.value // boolean
characters.value // Character[]

characters.add(character.value)
characters.add([newCharacter1, newCharacter2])

characters.delete(oldCharacter)
characters.delete([oldCharacter1, oldCharacter2])

characters.clear()
```

```ts
import { collection, BrowserStorageEngine } from "preact-signals-utils"

interface Menu {
    name: string
    price: number
}

const menus = collection<Menu>({
    storage: new BrowserStorageEngine({ path: "characters" }), // StorageEngine
    cacheIdentifier: "name", // keyof Menu
    // initialValue?: Menu[]
})
```

### `mapArray`

```ts
import type { ReadonlySignal } from "@preact/signals"
import { mapArray } from "preact-signals-utils"

declare const menus: ReadonlySignal<Menu[]>
const prices = mapArray(menus, menu => menu.value.price)
prices.value // number[]
```

### `selector`

```ts
import { signal, effect } from "@preact/signals"
import { selector, mapArray } from "preact-signals-utils"

const heroes = signal([
    { id: 1, name: "Wonder Woman" },
    { id: 2, name: "Superman" },
    { id: 3, name: "Batgirl" },
    { id: 4, name: "The Flash" },
])
const selected = signal<number | null>(null)
const isSelected = selector(selected)

const colors = mapArray(heroes, hero => {
    return isSelected(hero.value.id).value ? "purple" : "black"
})

effect(() => console.log(colors.value))
// => ["black", "black", "black", "black"]

selected.value = 1
// => ["purple", "black", "black", "black"]

selected.value = 4
// => ["black", "black", "black", "purple"]
```

## Combined Example

This is an example of a view model for a component utilizing most of the aforementioned signal utilities to create one unified object that can be used in any component.

```ts
// view-model.ts
import { signal, computed, effect } from "@preact/signals"
import type { ReadonlySignal } from "@preact/signals"
import { resource, collection, selector } from "preact-signals-utils"

export interface Character {
    id: number
    name: string
}

export class StarWarsViewModel {
    characterID = signal(1)
    character = resource(this.characterID, this.fetchUser)

    characterStore = collection<Character>({
        storage: new BrowserStorageEngine("star-wars-characters"),
    })
    sortedCharacters = computed(() => {
        return this.characterStore.value.sort((lhs, rhs) => rhs.id - lhs.id)
    })

    selectedCharacter = signal<number | null>(null)
    isSelected = selector(this.selectedCharacter)

    constructor() {
        effect(() => {
            if (this.character.value) {
                this.characterStore.add(this.character.value)
            }
        })
    }

    onInput = (event: JSX.TargetedEvent<HTMLInputElement, Event>) => {
        let value = event.currentTarget.value
        if (value.length) this.characterID.value = parseInt(value)
    }

    async fetchUser(id: number): Promise<Character> {
        let data = await fetch(`https://swapi.dev/api/people/${id}/`)
        let { name } = await data.json()
        return { id, name }
    }

    selectCharacter(character: ReadonlySignal<Character>) {
        this.selectedCharacter.value = character.value.id
    }
}
```

Here is how you would use this view model in your component:

```tsx
import { useMemo } from "preact/hooks"
import { useComputed } from "@preact/signals"
import { Show, For } from "preact-signals-utils"
import { StarWarsViewModel } from "./view-model"

export function StarWarsCharacters() {
    const model = useMemo(() => new StarWarsViewModel(), [])

    return (
        <>
            <input
                type="number"
                placeholder="Enter Numeric ID"
                min="1"
                value={model.characterID}
                onInput={model.onInput}
            />

            <Show when={model.character.loading}>Loading...</Show>

            <For each={model.sortedCharacters}>
                {character => (
                    <Character
                        character={character}
                        onSelect={() => model.selectCharacter(character)}
                    />
                )}
            </For>
        </>
    )
}

function Character({ character, onSelect }) {
    const style = useComputed(() => ({
        cursor: "pointer",
        color: model.isSelected(character.value.id).value ? "red" : "black",
    }))

    const text = useComputed(() => JSON.stringify(character.value, null, 4))

    return (
        <p style={style} onClick={onSelect}>
            <code>{text}</code>
        </p>
    )
}
```

## License

Published under the [MIT License](./LICENSE).
