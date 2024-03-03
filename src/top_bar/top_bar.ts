import {MRBox, RBox, WBox, calcBox, constBoxWrap} from "@nartallax/cardboard"
import * as css from "./top_bar.module.css"
import {tag} from "@nartallax/cardboard-dom"
import {Select} from "select/select"
import {formatDate} from "format_date"
import {Icon} from "generated/icons"
import {Ownership, getDefaultOwnershipDim} from "ownership"
import {TextInput} from "text_input/text_input"

interface Props {
	isEditing: RBox<boolean>
	ownership: WBox<Ownership>
	isAutoUpdating: WBox<boolean>
	lastUpdateTime: MRBox<Date | null>
	selectedDim: WBox<number>
	dims: MRBox<readonly number[]>
	rebuildTop: () => void
}

export const TopBar = (props: Props) => {
	const selectedDimOwner = calcBox([props.selectedDim, props.ownership],
		(dim, ownership) => ownership.dims[dim]?.ownedBy ?? "",
		(owner, dim, ownership) => [dim, {
			...ownership,
			dims: {
				...ownership.dims,
				[dim]: {
					...ownership.dims[dim] ?? getDefaultOwnershipDim(),
					ownedBy: owner
				}
			}
		}]
	)

	const result = tag({class: css.topBar}, [
		tag([
			"Dim: ",
			Select({
				options: calcBox(
					[props.dims, props.ownership],
					(dims, ownership) => dims.map(dim => {
						const owner = ownership.dims[dim]?.ownedBy ?? ""
						return ({
							label: dim + (owner ? " (" + owner + ")" : ""),
							value: dim
						})
					})
				),
				value: props.selectedDim
			}),
			props.isEditing.map(isEditing => !isEditing ? null : [
				"Owner: ",
				TextInput({
					value: selectedDimOwner,
					placeholder: "<nobody>",
					onBlur: props.rebuildTop
				}),
				tag({
					tag: "button",
					onClick: () => requestAnimationFrame(() => {
						const o = {...props.ownership.get()}
						for(const dim of Object.values(o.dims)){
							for(const region of dim.byChunks){
								delete region.id
							}
						}
						alert(JSON.stringify(o))
					})
				}, ["Ownership JSON"])
			])
		]),
		tag([
			"Last update time: ",
			constBoxWrap(props.lastUpdateTime).map(date => {
				return !date ? "never" : formatDate(date)
			}),
			tag({
				tag: "button",
				onClick: () => props.isAutoUpdating.set(!props.isAutoUpdating.get())
			}, [
				props.isAutoUpdating.map(x => `Autoupdate ${x ? "enabled" : "disabled"}`),
				tag({class: [Icon.reload]})
			])
		])
	])

	return result
}