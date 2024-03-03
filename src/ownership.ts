export interface Ownership {
	readonly dims: Readonly<Record<string, OwnershipDim>>
}

export interface OwnershipDim {
	readonly ownedBy: string
	readonly byChunks: readonly OwnershipChunkRange[]
}

export interface OwnershipChunkRange {
	readonly owner: string
	readonly x: number
	readonly y: number
	readonly width: number
	readonly height: number
	id?: number
}

export const getDefaultOwnership = (): Ownership => ({dims: {}})
export const getDefaultOwnershipDim = (): OwnershipDim => ({ownedBy: "", byChunks: []})