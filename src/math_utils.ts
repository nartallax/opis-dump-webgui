import {PanState} from "chunk_map/chunk_map"

export const regionSize = 512
export const chunkSize = 16
export const roundTo = (x: number, segment: number) => Math.round(x / segment) * segment
export const floorTo = (x: number, segment: number) => Math.floor(x / segment) * segment
export const ceilTo = (x: number, segment: number) => Math.ceil(x / segment) * segment

export const screenCoordsToInworldCoords = (pan: PanState, x: number, y: number) => {
	const rect = pan.getRoot().getBoundingClientRect()
	x -= rect.left + (rect.width / 2)
	y -= rect.top + (rect.height / 2)
	x /= pan.zoom.get()
	y /= pan.zoom.get()
	x += pan.x.get()
	y += pan.y.get()
	return {x, y}
}