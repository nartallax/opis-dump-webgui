import {bindBox, onMount, tag} from "@nartallax/cardboard-dom"
import {Dump, DumpChunk} from "dump"
import * as css from "./chunk_map.module.css"
import {MRBox, RBox, WBox, box, calcBox, constBoxWrap, unbox} from "@nartallax/cardboard"
import {pointerEventsToClientCoords} from "cursor_move_handler"
import {debounce} from "debounce"
import {Icon} from "generated/icons"
import {Ownership, OwnershipChunkRange, getDefaultOwnershipDim} from "ownership"
import {hasTargetWithClass} from "has_target_with_class"
import {ceilTo, chunkSize, floorTo, regionSize, roundTo, screenCoordsToInworldCoords} from "math_utils"
import {Regions} from "chunk_map/regions"
import {Grid} from "chunk_map/grid"
import {Chunks} from "chunk_map/chunks"
import {regionId} from "data"

interface Props {
	selectedDim: number
	isEditing: RBox<boolean>
	ownership: WBox<Ownership>
	dump: MRBox<Dump | null>
	chunks: MRBox<readonly DumpChunk[]>
	rebuildTop: () => void
}

const zoomMul = 1.25 // zoom speed

export interface PanState {
	readonly getRoot: () => HTMLElement
	readonly zoom: WBox<number>
	readonly x: WBox<number>
	readonly y: WBox<number>
}

export interface Bounds {
	readonly minX: number
	readonly maxX: number
	readonly minY: number
	readonly maxY: number
}

export const ChunkMap = ({chunks, dump, isEditing, ownership, selectedDim, rebuildTop}: Props) => {
	const pan: PanState = {
		getRoot: () => wrap,
		zoom: box(1),
		x: box(0),
		y: box(0)
	}

	const bounds = constBoxWrap(chunks).map(chunks => {
		const anyChunk = chunks[0]
		if(!anyChunk){
			return {minX: 0, maxX: 0, minY: 0, maxY: 0}
		}

		let minX = anyChunk.x, minY = anyChunk.z, maxX = anyChunk.x, maxY = anyChunk.z
		for(const chunk of chunks){
			minX = Math.min(chunk.x, minX)
			minY = Math.min(chunk.z, minY)
			maxX = Math.max(chunk.x, maxX)
			maxY = Math.max(chunk.z, maxY)
		}

		return {
			minX: floorTo(minX, regionSize),
			minY: floorTo(minY, regionSize),
			maxX: ceilTo(maxX, regionSize),
			maxY: ceilTo(maxY, regionSize)
		}
	})

	const fitToView = debounce("raf", () => {
		const b = bounds.get()
		const rect = wrap.getBoundingClientRect()
		const xRatio = rect.width / (b.maxX - b.minX)
		const yRatio = rect.height / (b.maxY - b.minY)
		let ratio = Math.min(xRatio, yRatio)
		if(!Number.isFinite(ratio)){
			ratio = 1
		}
		pan.zoom.set(ratio * 0.9)
		pan.x.set(b.minX + ((b.maxX - b.minX) / 2))
		pan.y.set(b.minY + ((b.maxY - b.minY) / 2))
	})

	const regions = Regions({
		rebuildTop,
		pan,
		isEditing,
		regions: ownership.prop("dims")
			.prop(selectedDim + "")
			.map(
				dimOrNull => dimOrNull ?? getDefaultOwnershipDim(),
				dim => dim
			)
			.prop("byChunks")
	})

	const chunkContainer = tag({
		class: css.chunkMap,
		style: {
			transform: calcBox([pan.zoom, pan.x, pan.y], (zoom, x, y) => `scale(${zoom}) translate(${-x}px, ${-y}px)`)
		}
	}, [
		Grid({bounds}),
		isEditing.map(isEditing => !isEditing ? regions : null),
		Chunks({
			chunks,
			dump,
			isDragging: () => mouseState.isDragging.get(),
			pan,
			selectedDim,
			ownership
		}),
		isEditing.map(isEditing => !isEditing ? null : regions)
	])

	const addOwnershipRegion = () => {
		const username = prompt("Username: ")
		if(!username){
			return
		}

		const region: OwnershipChunkRange = {
			owner: username,
			x: roundTo(pan.x.get(), chunkSize) - (chunkSize * 2),
			y: roundTo(pan.y.get(), chunkSize) - (chunkSize * 2),
			width: chunkSize * 4,
			height: chunkSize * 4,
			id: regionId.id++
		}
		const o = ownership.get()
		ownership.set({
			...o,
			dims: {
				...o.dims,
				[selectedDim]: {
					...(o.dims[selectedDim] ?? getDefaultOwnershipDim()),
					byChunks: [
						...(o.dims[selectedDim]?.byChunks ?? []),
						region
					]
				}
			}
		})

		rebuildTop()
	}

	const wrap = tag({class: css.chunkMapContainer}, [
		chunkContainer,
		tag({class: css.buttons}, [
			tag({
				tag: "button",
				class: Icon.corners,
				onClick: fitToView
			}),
			isEditing.map(isEditing => !isEditing ? null : tag({
				tag: "button",
				class: Icon.plus,
				onClick: addOwnershipRegion
			}))
		])
	])

	const mouseState = addMouseHandlers(pan)

	let initialFitToViewHappened = false
	const tryInitialFitToView = () => {
		if(initialFitToViewHappened || unbox(chunks).length < 1 || !wrap.isConnected){
			return
		}
		initialFitToViewHappened = true
		fitToView()
	}
	onMount(wrap, tryInitialFitToView)
	bindBox(wrap, chunks, tryInitialFitToView)

	return wrap
}

function addMouseHandlers(pan: PanState): {isDragging: RBox<boolean>} {
	const isDragging = box(false)

	let prevCoords: {x: number, y: number} | null = null

	onMount(pan.getRoot(), () => {
		const onWheel = (e: WheelEvent) => {
			const beforeCoords = prevCoords ? screenCoordsToInworldCoords(pan, prevCoords.x, prevCoords.y) : {x: 0, y: 0}

			const mul = e.deltaY > 0 ? 1 / zoomMul : zoomMul
			pan.zoom.set(pan.zoom.get() * mul)

			const afterCoords = prevCoords ? screenCoordsToInworldCoords(pan, prevCoords.x, prevCoords.y) : {x: 0, y: 0}
			pan.x.set(pan.x.get() + (beforeCoords.x - afterCoords.x))
			pan.y.set(pan.y.get() + (beforeCoords.y - afterCoords.y))
		}

		const onDown = (e: MouseEvent | TouchEvent) => {
			prevCoords = pointerEventsToClientCoords(e)
			const canDragByThisButton = e instanceof MouseEvent ? e.button === 0 : true
			const canDragByTarget = !hasTargetWithClass(e, css.draggable!)
			if(canDragByThisButton && canDragByTarget){
				isDragging.set(true)
			}
		}

		const onUp = (e: MouseEvent | TouchEvent) => {
			prevCoords = pointerEventsToClientCoords(e)
			isDragging.set(false)
		}

		const onMove = (e: MouseEvent | TouchEvent) => {
			const coords = pointerEventsToClientCoords(e)
			if(isDragging.get() && prevCoords){
				pan.x.set(pan.x.get() + (prevCoords.x - coords.x) / pan.zoom.get())
				pan.y.set(pan.y.get() + (prevCoords.y - coords.y) / pan.zoom.get())
			}
			prevCoords = coords
		}

		pan.getRoot().addEventListener("mousedown", onDown, {passive: true})
		pan.getRoot().addEventListener("touchstart", onDown, {passive: true})
		window.addEventListener("mousemove", onMove, {passive: true})
		window.addEventListener("touchmove", onMove, {passive: true})
		window.addEventListener("mouseup", onUp, {passive: true})
		window.addEventListener("touchend", onUp, {passive: true})
		window.addEventListener("wheel", onWheel, {passive: true})

		return () => {
			pan.getRoot().removeEventListener("mousedown", onDown)
			pan.getRoot().removeEventListener("touchstart", onDown)
			window.removeEventListener("mousemove", onMove)
			window.removeEventListener("touchmove", onMove)
			window.removeEventListener("mouseup", onUp)
			window.removeEventListener("touchend", onUp)
			window.removeEventListener("wheel", onWheel)
		}
	})

	return {isDragging}
}