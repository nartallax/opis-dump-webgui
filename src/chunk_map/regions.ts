import {PanState} from "chunk_map/chunk_map"
import * as css from "./chunk_map.module.css"
import {RBox, WBox, isArrayItemWBox} from "@nartallax/cardboard"
import {OwnershipChunkRange} from "ownership"
import {onMount, tag} from "@nartallax/cardboard-dom"
import {addCursorMoveHandler, pointerEventsToClientCoords} from "cursor_move_handler"
import {hasTargetWithClass} from "has_target_with_class"
import {chunkSize, roundTo, screenCoordsToInworldCoords} from "math_utils"
import {Icon} from "generated/icons"
import {TextInput} from "text_input/text_input"

interface Props {
	pan: PanState
	isEditing: RBox<boolean>
	regions: WBox<readonly OwnershipChunkRange[]>
	rebuildTop: () => void
}

export const Regions = ({pan, isEditing, regions, rebuildTop}: Props) => {
	return tag([
		regions.mapArray(
			range => range.id,
			range => {
				const region = tag({
					class: [css.ownershipRegion, {
						[css.draggable!]: isEditing
					}],
					style: {
						top: range.prop("y").map(x => x + "px"),
						left: range.prop("x").map(x => x + "px"),
						width: range.prop("width").map(x => x + "px"),
						height: range.prop("height").map(x => x + "px")
					}
				}, [
					isEditing.map(isEditing => !isEditing ? null : [
						RegionPivot(pan, range, false, false, rebuildTop),
						RegionPivot(pan, range, true, false, rebuildTop),
						RegionPivot(pan, range, false, true, rebuildTop),
						RegionPivot(pan, range, true, true, rebuildTop)
					])
				])

				let offset = {x: 0, y: 0}
				let start = {x: 0, y: 0}
				let isDragging = false

				addCursorMoveHandler({
					element: region,
					onDown: e => {
						if(hasTargetWithClass(e, css.regionPivot!)){
							return false
						}

						if(!isEditing.get()){
							showRegionModal(e, range, isEditing)
							return false
						}

						const rect = region.getBoundingClientRect()
						const coords = pointerEventsToClientCoords(e)
						offset = {
							x: coords.x - rect.x,
							y: coords.y - rect.y
						}

						const r = range.get()
						start = {x: r.x, y: r.y}
						isDragging = true

						return true
					},
					onMove: e => {
						const coords = pointerEventsToClientCoords(e)
						const {x, y} = screenCoordsToInworldCoords(pan, coords.x - offset.x, coords.y - offset.y)
						range.set({
							...range.get(),
							x: roundTo(x, chunkSize),
							y: roundTo(y, chunkSize)
						})
					},
					onUp: e => {
						const r = range.get()
						if(r.x === start.x && r.y === start.y && isDragging){
							showRegionModal(e, range, isEditing, rebuildTop)
						} else {
							rebuildTop()
						}
						isDragging = false
					}
				})

				return region
			}
		)
	])
}

const RegionPivot = (pan: PanState, range: WBox<OwnershipChunkRange>, xHigh: boolean, yHigh: boolean, rebuildTop: () => void) => {
	const result = tag({
		class: [css.regionPivot, css.draggable],
		style: {
			left: xHigh ? undefined : "-3.5px",
			right: xHigh ? "-3.5px" : undefined,
			top: yHigh ? undefined : "-3.5px",
			bottom: yHigh ? "-3.5px" : undefined
		}
	})

	addCursorMoveHandler({
		element: result,
		onMove: e => {
			const cursor = pointerEventsToClientCoords(e)
			let {x, y} = screenCoordsToInworldCoords(pan, cursor.x, cursor.y)
			x = roundTo(x, chunkSize)
			y = roundTo(y, chunkSize)
			const r = {...range.get()}
			if(xHigh){
				r.width = x - r.x
			} else {
				r.width = (r.x - x) + r.width
				r.x = x
			}
			if(yHigh){
				r.height = y - r.y
			} else {
				r.height = (r.y - y) + r.height
				r.y = y
			}
			range.set(r)
			rebuildTop()
		}
	})

	return result
}

const showRegionModal = (e: MouseEvent | TouchEvent, region: WBox<OwnershipChunkRange>, isEditing: RBox<boolean>, rebuildTop?: () => void) => {
	const close = () => {
		modal.remove()
	}

	const coords = pointerEventsToClientCoords(e)
	const modal = tag({
		class: css.regionModal,
		style: {
			left: coords.x + "px",
			top: coords.y + "px"
		}
	}, [
		tag({class: css.regionOwnerLabel}, [
			"Owned by: ",
			isEditing.map(isEditing => !isEditing ? tag({class: css.regionOwnerName}, [region.prop("owner")]) : TextInput({
				value: region.prop("owner"),
				onBlur: rebuildTop
			}))
		]),
		isEditing.map(isEditing => !isEditing ? null : tag({class: css.regionModalButtons}, [
			tag({
				tag: "button",
				class: Icon.trash,
				onClick: () => {
					if(isArrayItemWBox(region)){
						region.deleteArrayElement()
						rebuildTop?.()
					}
					close()
				}
			})
		]))
	])

	onMount(modal, () => {
		const clickListener = (e: Event) => {
			if(!hasTargetWithClass(e, css.regionModal!)){
				close()
			}
		}
		requestAnimationFrame(() => {
			if(modal.isConnected){
				window.addEventListener("mousedown", clickListener, {passive: true})
				window.addEventListener("touchstart", clickListener, {passive: true})
			}
		})
		return () => {
			window.removeEventListener("mousedown", clickListener)
			window.removeEventListener("touchstart", clickListener)
		}
	})

	document.body.appendChild(modal)
}