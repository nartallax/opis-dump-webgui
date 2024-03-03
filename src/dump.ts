export interface Dump {
	readonly date: Date
	readonly dims: ReadonlyMap<number, readonly DumpChunk[]>
	readonly totalLoad: number
}

export interface DumpChunk {
	readonly x: number
	readonly z: number
	readonly load: number
}

export function parseDump(tsv: string): Dump {
	const lines = tsv.split("\n")
	if(lines.length < 2){
		throw new Error("Bad dump: too small")
	}
	const date = new Date(parseInt(lines[0]!))

	let totalLoad = 0
	const dims = new Map<number, DumpChunk[]>()
	const lineCount = parseInt(lines[1]!)
	for(let i = 0; i < lineCount; i++){
		const lineArr = (lines[i + 2]!).split("\t")
		if(lineArr.length !== 4){
			throw new Error("Bad line: " + lines[i + 2])
		}
		const x = parseFloat(lineArr[0]!) * 16
		const z = parseFloat(lineArr[1]!) * 16
		const dim = parseFloat(lineArr[2]!)
		const load = parseFloat(lineArr[3]!)
		totalLoad += load

		let arr = dims.get(dim)
		if(!arr){
			arr = []
			dims.set(dim, arr)
		}
		arr.push({x, z, load})
	}


	console.log({loadSum: totalLoad})
	return {date, dims, totalLoad}
}