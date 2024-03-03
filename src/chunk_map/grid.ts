import {RBox, calcBox} from "@nartallax/cardboard"
import {tag} from "@nartallax/cardboard-dom"
import {Bounds} from "chunk_map/chunk_map"
import * as css from "./chunk_map.module.css"
import {regionSize} from "math_utils"

interface Props {
	bounds: RBox<Bounds>
}


export const Grid = ({bounds}: Props) => {
	const xCount = calcBox(
		[bounds.prop("minX"), bounds.prop("maxX")],
		(minX, maxX) => Math.ceil((maxX - minX) / regionSize) + 1)
	const yCount = calcBox(
		[bounds.prop("minY"), bounds.prop("maxY")],
		(minY, maxY) => Math.ceil((maxY - minY) / regionSize) + 1)
	const xBoldIndex = bounds.prop("minX").map(x => -x / regionSize)
	const yBoldIndex = bounds.prop("minY").map(x => -x / regionSize)
	return tag({
		class: css.grid,
		style: {
			top: bounds.prop("minY").map(x => x + "px"),
			bottom: bounds.prop("maxY").map(x => -x + "px"),
			left: bounds.prop("minX").map(x => x + "px"),
			right: bounds.prop("maxX").map(x => -x + "px")
		}
	}, [
		xCount.map(count => new Array(count).fill(null).map((_, i) => tag({
			class: [css.v, {[css.bold!]: xBoldIndex.map(x => x === i)}],
			style: {
				left: (i * regionSize) + "px"
			}
		}))),
		yCount.map(count => new Array(count).fill(null).map((_, i) => tag({
			class: [css.h, {[css.bold!]: yBoldIndex.map(x => x === i)}],
			style: {
				top: (i * regionSize) + "px"
			}
		})))
	])
}