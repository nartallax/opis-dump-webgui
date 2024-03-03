const td = (x: number) => (x > 9 ? "" : "0") + x

export function formatDate(d: Date): string {
	return `${d.getFullYear()}.${td(d.getMonth() + 1)}.${td(d.getDate())} ${td(d.getHours())}:${td(d.getMinutes())}:${td(d.getSeconds())}`
}