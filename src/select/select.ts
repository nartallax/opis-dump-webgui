import {MRBox, WBox, constBoxWrap} from "@nartallax/cardboard"
import {tag} from "@nartallax/cardboard-dom"

interface Props<T> {
	options: MRBox<readonly {label: string, value: T}[]>
	value: WBox<T>
}

export const Select = <T extends string | number>(props: Props<T>) => {
	const select = tag({
		tag: "select",
		attrs: {
			value: props.value.map(x => JSON.stringify(x))
		}
	}, [
		constBoxWrap(props.options).mapArray(
			opt => opt.value,
			opt => tag({
				tag: "option",
				attrs: {
					value: opt.prop("value").map(x => JSON.stringify(x))
				}
			}, [opt.prop("label")])
		)
	])

	select.addEventListener("change", () => {
		props.value.set(JSON.parse(select.value))
	})

	return select
}