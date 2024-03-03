export function debounce(time: number | "raf", handler: () => void): () => void {
	let timer: ReturnType<typeof setTimeout> | ReturnType<typeof requestAnimationFrame> | null = null

	return () => {
		if(timer){
			return
		}

		if(time === "raf"){
			timer = requestAnimationFrame(() => {
				timer = null
				handler()
			})
		} else {
			timer = setTimeout(() => {
				timer = null
				handler()
			}, time)
		}
	}
}