export function hasTargetWithClass(e: Event, cls: string): boolean {
	let target = e.target
	while(target && target !== document.body){
		if(target instanceof HTMLElement){
			if(target.classList.contains(cls)){
				return true
			}
		}
		if(target instanceof Node){
			target = target.parentNode
		} else {
			return false
		}
	}
	return false
}