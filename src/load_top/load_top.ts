import {tag} from "@nartallax/cardboard-dom"
import * as css from "./load_top.module.css"
import {RBox, calcBox} from "@nartallax/cardboard"
import {Dump} from "dump"

export interface LoadEntry {
	owner: string
	load: number
}

interface Props {
	data: RBox<readonly LoadEntry[]>
	dump: RBox<Dump | null>
}

export const LoadTop = (props: Props) => {
	return tag({class: css.loadTop}, [
		tag({class: css.loadTotal}, [
			props.dump.map(d => {
				const load = d?.totalLoad ?? 0
				return [
					tag(["Total:"]),
					tag({class: css.spacer}),
					tag([(load / 1000000).toFixed(3) + "ms"]),
					tag({class: css.loadPercent}, ["(100.00%)"])
				]
			})
		]),
		props.data.mapArray(
			entry => entry.owner,
			entry => tag({class: css.loadEntry}, [
				tag([entry.prop("owner")]),
				tag({class: css.spacer}),
				tag([entry.prop("load").map(load => {
					return (load / 1000000).toFixed(3) + "ms"
				})]),
				tag({class: css.loadPercent}, [calcBox([entry.prop("load"), props.dump], (load, dump) => {
					const loadPercentStr = ((load / (dump?.totalLoad ?? 0)) * 100).toFixed(2)
					return `(${loadPercentStr}%)`
				})])
			])
		)
	])
}