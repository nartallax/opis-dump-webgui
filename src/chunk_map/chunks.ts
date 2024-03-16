import {MRBox, RBox, constBoxWrap, unbox} from "@nartallax/cardboard"
import {tag} from "@nartallax/cardboard-dom"
import {PanState} from "chunk_map/chunk_map"
import {Dump, DumpChunk} from "dump"
import {Ownership} from "ownership"
import * as css from "./chunk_map.module.css"
import {lerp, lerpHsl, rgbNumberToColorString} from "color_utils"
import {getChunkOwnership} from "data"
import {chunkSize} from "math_utils"

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
const goodEnd = 2000
const badEnd = 250000

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
			opacity: chunk.prop("load").map(load =>
				lerp(0.1, 1, load / goodEnd)
			),
			backgroundColor: chunk.prop("load").map(load => {
				const loadRate = load > badEnd ? 1 : load <= goodEnd ? 0 : (load - goodEnd) / (badEnd - goodEnd)
				return rgbNumberToColorString(lerpHsl(goodColor, badColor, loadRate))
			}),
			top: chunk.prop("z").map(z => z + "px"),
			left: chunk.prop("x").map(x => x + "px")
		},
		onClick: () => {
			const {x, z} = chunk.get()
			void navigator.clipboard.writeText((x + (chunkSize / 2)) + ", " + (z + (chunkSize / 2)))
		}
	})

	chunkTag.addEventListener("mouseover", () => {
		if(props.isDragging()){
			return
		}
		const {x, z, load} = chunk.get()
		const totalLoad = unbox(props.dump)?.totalLoad ?? 0
		const boundsStr = `Bounds (x, z): from ${x}, ${z} to ${x + chunkSize - 1}, ${z + chunkSize - 1}`
		const centerStr = `Center (x, z): ${x + (chunkSize / 2)}, ${z + (chunkSize / 2)}`
		const loadStr = `Load: ${(load / 1000000).toFixed(3)}ms (${((load / totalLoad) * 100).toFixed(2)}%)`
		const ownershipStr = `Owned by: ${getChunkOwnership(props.ownership.get(), props.selectedDim, x, z)}`
		chunkHint = tag({
			class: css.chunkHint,
			style: {
				top: chunk.prop("z").map(z => z + "px"),
				left: chunk.prop("x").map(x => x + "px"),
				transform: props.pan.zoom.map(zoom => `scale(${1 / zoom}) translate(0.5rem, 0.5rem)`)
			}
		}, [[centerStr, boundsStr, loadStr, ownershipStr].join("\n")])
		chunkTag.parentElement?.append(chunkHint)
	})

	chunkTag.addEventListener("mouseout", () => {
		chunkHint?.remove()
		chunkHint = null
	})

	return chunkTag
}