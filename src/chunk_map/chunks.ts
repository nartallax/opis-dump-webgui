import {MRBox, RBox, constBoxWrap, unbox} from "@nartallax/cardboard"
import {tag} from "@nartallax/cardboard-dom"
import {PanState} from "chunk_map/chunk_map"
import {Dump, DumpChunk} from "dump"
import {Ownership} from "ownership"
import * as css from "./chunk_map.module.css"
import {lerpHsl, rgbNumberToColorString} from "color_utils"
import {getChunkOwnership} from "data"

interface Props {
	dump: MRBox<Dump | null>
	chunks: MRBox<readonly DumpChunk[]>
	isDragging: () => boolean
	pan: PanState
	selectedDim: number
	ownership: RBox<Ownership>
}

const goodColor = 0x00ff00
const badColor = 0xff0000
// not based on anything really
const goodEnd = 250
const badEnd = 100000

export const Chunks = (props: Props) => {
	return constBoxWrap(props.chunks).mapArray(
		chunk => chunk.x + "|" + chunk.z,
		chunk => Chunk(chunk, props)
	)
}

const Chunk = (chunk: RBox<DumpChunk>, props: Props) => {
	let chunkHint: HTMLElement | null = null

	const chunkTag = tag({
		class: css.chunk,
		style: {
			backgroundColor: chunk.prop("load").map(load => {
				const loadRate = load > badEnd ? 1 : load <= goodEnd ? 0 : (load - goodEnd) / (badEnd - goodEnd)
				return rgbNumberToColorString(lerpHsl(goodColor, badColor, loadRate))
			}),
			top: chunk.prop("z").map(z => z + "px"),
			left: chunk.prop("x").map(x => x + "px")
		}
	})

	chunkTag.addEventListener("mouseover", () => {
		if(props.isDragging()){
			return
		}
		const {x, z, load} = chunk.get()
		const totalLoad = unbox(props.dump)?.totalLoad ?? 0
		const coordsStr = `Coords: x = ${x}, z = ${z}`
		const loadStr = `Load: ${load.toFixed(2)} (${((load / totalLoad) * 100).toFixed(2)}%)`
		const ownershipStr = `Owned by: ${getChunkOwnership(props.ownership.get(), props.selectedDim, x, z)}`
		chunkHint = tag({
			class: css.chunkHint,
			style: {
				top: chunk.prop("z").map(z => z + "px"),
				left: chunk.prop("x").map(x => x + "px"),
				transform: props.pan.zoom.map(zoom => `scale(${1 / zoom}) translate(0.5rem, 0.5rem)`)
			}
		}, [[coordsStr, loadStr, ownershipStr].join("\n")])
		chunkTag.parentElement?.append(chunkHint)
	})

	chunkTag.addEventListener("mouseout", () => {
		chunkHint?.remove()
		chunkHint = null
	})

	return chunkTag
}