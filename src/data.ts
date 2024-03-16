import {WBox} from "@nartallax/cardboard"
import {Dump, parseDump} from "dump"
import {LoadEntry} from "load_top/load_top"
import {Ownership, OwnershipChunkRange, getDefaultOwnership} from "ownership"
import RBush, {BBox} from "rbush"

const isDev = window.location.hostname === "localhost"
const dumpUrl = isDev ? "http://localhost:61537/chunk_stats_dump.tsv" : "https://api.zonasumraka.ru/chunk_stats_dump.tsv"
const ownershipUrl = "./chunk_ownership.json"

export async function loadDump(dump: WBox<Dump | null>): Promise<Dump> {
	const resp = await fetch(dumpUrl + "?t=" + Date.now())
	const tsv = await resp.text()
	const result = parseDump(tsv)
	dump.set(result)
	return result
}

export const regionId = {id: 1}
export async function loadOwnership(ownership: WBox<Ownership>): Promise<void> {
	let result: Ownership
	if(isDev){
		const stored = localStorage["devOwnership"]
		result = stored ? JSON.parse(stored) : getDefaultOwnership()
	} else {
		const resp = await fetch(ownershipUrl + "?t=" + Date.now())
		result = await resp.json()
	}

	for(const dim of Object.values(result.dims)){
		for(const region of dim.byChunks){
			region.id = regionId.id++
		}
	}

	ownership.set(result)
}

type OwnershipBBox = BBox & {
	owner: string
}

const makeRbush = (regions: readonly OwnershipChunkRange[]): RBush<OwnershipBBox> => {
	const bush = new RBush<OwnershipBBox>()
	bush.load(regions.map(r => ({
		minX: r.x,
		maxX: r.x + r.width,
		minY: r.y,
		maxY: r.y + r.height,
		owner: r.owner
	})))
	return bush
}

export const getChunkOwnership = (ownership: Ownership, dimNum: number, x: number, y: number): string => {
	const dim = ownership.dims[dimNum]
	if(!dim){
		return ""
	}

	const owner = makeRbush(dim.byChunks).search({
		minX: x + 0.5, maxX: x + 1,
		minY: y + 0.5, maxY: y + 1
	})[0]

	return owner?.owner ?? dim.ownedBy
}

export const recalcTopLoad = (ownership: Ownership, dump: Dump): LoadEntry[] => {
	let unknownLoad = dump.totalLoad
	const ownersLoad = new Map<string, number>()

	for(const [dimKey, chunks] of dump.dims.entries()){
		const dim = ownership.dims[dimKey]
		const bush = makeRbush(dim?.byChunks ?? [])
		for(const chunk of chunks){
			const owner = bush.search({
				minX: chunk.x + 0.5, maxX: chunk.x + 1,
				minY: chunk.z + 0.5, maxY: chunk.z + 1
			})[0]?.owner ?? dim?.ownedBy ?? ""

			if(owner){
				unknownLoad -= chunk.load
				ownersLoad.set(owner, (ownersLoad.get(owner) ?? 0) + chunk.load)
			}
		}
	}

	const result = [...ownersLoad.entries()].map(([owner, load]) => ({owner, load}))
	if(unknownLoad > 0){
		result.push({owner: "<???>", load: unknownLoad})
	}

	result.sort((a, b) => b.load - a.load)
	return result
}