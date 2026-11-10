/** Persian display helpers (VibeFarsi-aligned). Latin digits stay in data/API payloads. */

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function faDigits(value: string | number): string {
	return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)] ?? d);
}

export function faNumber(n: number, fractionDigits = 0): string {
	const fixed = Number.isFinite(n) ? n.toFixed(fractionDigits) : '0';
	const [intPart, frac] = fixed.split('.');
	const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
	return faDigits(frac ? `${withSep}٫${frac}` : withSep);
}

export function faPercent(n: number): string {
	return `${faNumber(Math.round(n))}٪`;
}
