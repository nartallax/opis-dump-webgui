export function pointerEventsToClientCoords(e: MouseEvent | TouchEvent): {x: number, y: number} {
	if(isTouchEvent(e)){
		const touch = e.touches[0]!
		return {
			x: touch.clientX,
			y: touch.clientY
		}
	} else {
		return {
			x: e.clientX,
			y: e.clientY
		}
	}
}

export function pointerEventsToOffsetCoords(e: MouseEvent | TouchEvent): {x: number, y: number} | null {
	if(!(e.target instanceof HTMLElement)){
		return null
	}

	const rect = e.target.getBoundingClientRect() // performance may suck, but whatever
	const coords = pointerEventsToClientCoords(e)
	coords.x -= rect.left
	coords.y -= rect.top
	return coords
}

export function isTouchEvent(e: MouseEvent | TouchEvent): e is TouchEvent {
	return !!(e as TouchEvent).touches
}

type CursorMoveHandlerParams = {
	readonly element: HTMLElement
	onMove(e: MouseEvent | TouchEvent): void
	// `false` means "don't start"
	onDown?(e: MouseEvent | TouchEvent): boolean | void
	onUp?(e: MouseEvent | TouchEvent): void
	/** If true, onMove will be invoked when down event happen */
	readonly downIsMove?: boolean
	/** If true, onMove will be invoked when up event happen */
	readonly upIsMove?: boolean
}

/** This is a good way to add a mousemove handler to an element */
export function addCursorMoveHandler(params: CursorMoveHandlerParams): void {

	const onDown = (e: MouseEvent | TouchEvent) => {
		if(params.onDown){
			if(params.onDown(e) === false){
				return
			}
		}
		window.addEventListener("mousemove", params.onMove, {passive: true})
		window.addEventListener("touchmove", params.onMove, {passive: true})
		window.addEventListener("mouseup", onUp, {passive: true})
		window.addEventListener("touchend", onUp, {passive: true})
		if(params.downIsMove){
			params.onMove(e)
		}
	}

	const onUp = (e: MouseEvent | TouchEvent) => {
		window.removeEventListener("mousemove", params.onMove)
		window.removeEventListener("touchmove", params.onMove)
		window.removeEventListener("mouseup", onUp)
		window.removeEventListener("touchend", onUp)
		if(params.upIsMove){
			params.onMove(e)
		}
		if(params.onUp){
			params.onUp(e)
		}
	}

	params.element.addEventListener("mousedown", onDown, {passive: true})
	params.element.addEventListener("touchstart", onDown, {passive: true})
}

export function preventContextMenu(el: HTMLElement): void {
	el.addEventListener("contextmenu", e => {
		e.preventDefault()
		e.stopPropagation()
		return false
	})
}