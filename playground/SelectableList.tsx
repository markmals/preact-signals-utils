import { signal, Signal, useComputed, useSignal } from "@preact/signals"
import { For, Selector, useSelector } from "../src"

const list = signal<{ id: number; name: string }[]>([
    { id: 1, name: "Mac" },
    { id: 2, name: "Charlie" },
    { id: 3, name: "Dennis" },
    { id: 4, name: "Dee" },
    { id: 5, name: "Frank" },
])

namespace SelectedRow {
    export interface Props {
        item: {
            id: number
            name: string
        }
        selector: Selector<number>
        selected: Signal<number>
    }
}

function SelectableRow({ item, selector: isSelected, selected }: SelectedRow.Props) {
    const label = useComputed(() => `${item.name}${isSelected(item.id).value ? " | selected" : ""}`)
    // const style = useComputed(() => (isSelected(item.id).value ? { color: "blue" } : {}))

    // FIXME: This doesn't work as a computed passed directly into the `style` hole
    return (
        <li
            style={isSelected(item.id).value ? { color: "blue" } : {}}
            onClick={() => (selected.value = item.id)}
        >
            {label}
        </li>
    )
}

export function SelectableList() {
    const selected = useSignal<number | null>(null)
    const selector = useSelector(selected)

    return (
        <ul style={{ cursor: "pointer" }}>
            <For each={list}>
                {item => <SelectableRow item={item} selector={selector} selected={selected} />}
            </For>
        </ul>
    )
}
