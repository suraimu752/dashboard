export function parseTimestampToMs(ts: string): number {
	// Memory points are ISO (e.g. 2026-05-05T10:01:00.000Z)
	// DB points may be "YYYY-MM-DD HH:mm:ss" (space-separated).
	const normalized = ts.includes('T') ? ts : ts.replace(' ', 'T');
	const ms = Date.parse(normalized);
	return Number.isFinite(ms) ? ms : 0;
}

export function roundDateToMinute(date: Date): Date {
	const d = new Date(date);
	d.setSeconds(0, 0);
	return d;
}

