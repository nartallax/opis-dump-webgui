import {MRBox, WBox} from "@nartallax/cardboard"
import {bindBox, tag} from "@nartallax/cardboard-dom"

interface Props {
	value: WBox<string>
	onBlur?: () => void
	placeholder?: MRBox<string>
}

export const TextInput = (props: Props) => {
	const input = tag({
		tag: "input",
		attrs: {
			placeholder: props.placeholder
		}
	})

	const update = () => {
		props.value.set(input.value)
	}

	input.addEventListener("change", update)
	input.addEventListener("focus", update)
	input.addEventListener("blur", () => {
		update()
		props.onBlur?.()
	})
	input.addEventListener("keydown", update)
	input.addEventListener("keyup", update)
	input.addEventListener("keypress", update)
	input.addEventListener("paste", update)

	bindBox(input, props.value, value => input.value = value)

	return input
}