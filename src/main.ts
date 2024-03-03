import "./main_style.module.css"
import {initializeCardboardDom} from "@nartallax/cardboard-dom"
import {MainPage} from "main_page/main_page"

async function main(): Promise<void> {
	await initializeCardboardDom()
	document.body.appendChild(MainPage())
}

void main()