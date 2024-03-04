import {bindBox, onMount, tag} from "@nartallax/cardboard-dom"
import * as css from "./main_page.module.css"
import {box} from "@nartallax/cardboard"
import {Dump} from "dump"
import {loadDump, loadOwnership, recalcTopLoad} from "data"
import {TopBar} from "top_bar/top_bar"
import {ChunkMap} from "chunk_map/chunk_map"
import {Ownership} from "ownership"
import {LoadEntry, LoadTop} from "load_top/load_top"

export const MainPage = () => {
	const isAutoUpdating = box(true)
	const dump = box<Dump | null>(null)
	const selectedDim = box(0)
	const isEditing = box(false)
	const ownership = box<Ownership>({dims: {}})

	const top = box<readonly LoadEntry[]>([])
	const rebuildTop = () => {
		const o = ownership.get()
		const d = dump.get()
		const entries = !o || !d ? [] : recalcTopLoad(o, d)
		return top.set(entries)
	}

	const onDumpLoaded = (dump: Dump) => {
		const dims = new Set(dump.dims.keys())
		if(!dims.has(selectedDim.get())){
			const lowestDim = [...dims].sort((a, b) => a - b)[0] ?? 0
			selectedDim.set(lowestDim)
		}
		rebuildTop()
	}

	void loadOwnership(ownership).then(rebuildTop)

	const result = tag({class: css.mainPage}, [
		tag({class: css.leftColumn}, [
			LoadTop({
				dump,
				data: top
			})
		]),
		tag({class: css.rightColumn}, [
			TopBar({
				isEditing,
				ownership,
				isAutoUpdating,
				dims: dump.map(dump => !dump ? [0] : [...dump.dims.keys()]),
				lastUpdateTime: dump.map(dump => dump?.date ?? null),
				selectedDim,
				rebuildTop
			}),
			selectedDim.map(dim => ChunkMap({
				rebuildTop,
				chunks: dump.map(dump => dump?.dims.get(dim) ?? []),
				dump,
				isEditing,
				ownership,
				selectedDim: dim
			}))
		])
	])

	onMount(result, () => {
		const interval = setInterval(() => {
			if(isAutoUpdating.get()){
				void loadDump(dump).then(onDumpLoaded)
			}
		}, 60000)

		const checkHash = () => {
			isEditing.set(window.location.hash === "#edit")
		}
		window.addEventListener("hashchange", checkHash, {passive: true})
		checkHash()

		return () => {
			clearInterval(interval)
			window.removeEventListener("hashchange", checkHash)
		}
	}, {ifInDom: "call"})

	bindBox(result, isAutoUpdating, isAutoUpdating => {
		if(isAutoUpdating){
			void loadDump(dump).then(onDumpLoaded)
		}
	})

	return result
}