function twoHex(x: number): string {
	return (x > 0xf ? "" : "0") + x.toString(16)
}

export function colorNumberTo3Components(color: number): [r: number, g: number, b: number] {
	const r = (color >> 16) & 0xff,
		g = (color >> 8) & 0xff,
		b = (color >> 0) & 0xff
	return [r, g, b]
}

export function color3ComponentsToNumber(components: [r: number, g: number, b: number]): number {
	const [r, g, b] = components
	return (r << 16) | (g << 8) | b
}

export function rgbToHsl(color: number): number {
	let [r, g, b] = colorNumberTo3Components(color)
	// Make r, g, and b fractions of 1
	r /= 255
	g /= 255
	b /= 255

	// Find greatest and smallest channel values
	const cmin = Math.min(r, g, b),
		cmax = Math.max(r, g, b),
		delta = cmax - cmin
	let h = 0,
		s = 0,
		l = 0

	// Calculate hue
	// No difference
	if(delta === 0){
		h = 0
	} else if(cmax === r){
		// Red is max
		h = ((g - b) / delta) % 6
	} else if(cmax === g){
		// Green is max
		h = (b - r) / delta + 2
	} else {
		// Blue is max
		h = (r - g) / delta + 4
	}

	h = Math.round(h * 60)

	// Make negative hues positive behind 360°
	if(h < 0){
		h += 360
	}

	// Calculate lightness
	l = (cmax + cmin) / 2

	// Calculate saturation
	s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

	// Multiply l and s by 100
	s = +(s * 100).toFixed(1)
	l = +(l * 100).toFixed(1)

	return color3ComponentsToNumber([(h / 360) * 255, (s / 100) * 255, (l / 100) * 255])
}

export function hslToRgb(hsl: number): number {
	let [h, s, l] = colorNumberTo3Components(hsl)
	h /= 255
	s /= 255
	l /= 255
	let r: number, g: number, b: number

	if(s === 0){
		r = g = b = l // achromatic
	} else {
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s
		const p = 2 * l - q
		r = hueToRgb(p, q, h + 1 / 3)
		g = hueToRgb(p, q, h)
		b = hueToRgb(p, q, h - 1 / 3)
	}

	return color3ComponentsToNumber([Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)])
}

function hueToRgb(p: number, q: number, t: number): number {
	if(t < 0){
		t += 1
	}
	if(t > 1){
		t -= 1
	}
	if(t < 1 / 6){
		return p + (q - p) * 6 * t
	}
	if(t < 1 / 2){
		return q
	}
	if(t < 2 / 3){
		return p + (q - p) * (2 / 3 - t) * 6
	}
	return p
}

export function rgbNumberToColorString(rgb: number): string {
	const b = rgb & 0xff
	rgb >>= 8
	const g = rgb & 0xff
	rgb >>= 8
	const r = rgb & 0xff

	return "#" + twoHex(r) + twoHex(g) + twoHex(b)
}

export function transformColorHsl(colorRgb: number, transform: (hsl: [number, number, number]) => [number, number, number]): number {
	const transformResult = transform(
		colorNumberTo3Components(
			rgbToHsl(colorRgb)
		)
	)
	transformResult[0] = Math.max(0, Math.min(255, Math.round(transformResult[0])))
	transformResult[1] = Math.max(0, Math.min(255, Math.round(transformResult[1])))
	transformResult[2] = Math.max(0, Math.min(255, Math.round(transformResult[2])))
	return hslToRgb(
		color3ComponentsToNumber(
			transformResult
		)
	)
}

function lerp(a: number, b: number, progress: number): number {
	return a + ((b - a) * progress)
}

export function lerpHsl(zero: number, one: number, value: number): number {
	const zeroHsl = colorNumberTo3Components(rgbToHsl(zero))
	const oneHsl = colorNumberTo3Components(rgbToHsl(one))
	return hslToRgb(color3ComponentsToNumber([
		Math.max(0, Math.min(255, Math.round(lerp(zeroHsl[0], oneHsl[0], value)))),
		Math.max(0, Math.min(255, Math.round(lerp(zeroHsl[1], oneHsl[1], value)))),
		Math.max(0, Math.min(255, Math.round(lerp(zeroHsl[2], oneHsl[2], value))))
	]))
}