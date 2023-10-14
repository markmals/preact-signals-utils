import { computed, effect, signal } from "@preact/signals"
import { JSX } from "preact/jsx-runtime"
import { BrowserStorageEngine, collection, resource } from "../src"

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
}
