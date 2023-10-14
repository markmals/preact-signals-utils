import { useMemo } from "preact/hooks"
import { For, Show } from "../src"
import { StarWarsViewModel } from "./StarWarsViewModel"

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
                {character => <pre>{JSON.stringify(character, null, 4)}</pre>}
            </For>
        </>
    )
}
