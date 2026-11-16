export type CreditModel = 'cheque' | 'person' | 'legal';

export type ScoreBand = { label: string; min: number; max: number; color: string };

export const MODEL_BADGE: Record<CreditModel, string> = {
	cheque: 'چک',
	person: 'حقیقی',
	legal: 'حقوقی'
};

export const MODEL_LABEL: Record<CreditModel, string> = {
	cheque: 'امتیاز اعتبار چک',
	person: 'امتیاز اعتباری حقیقی',
	legal: 'امتیاز اعتباری حقوقی'
};

const DEFAULT_BANDS: ScoreBand[] = [
	{ label: 'ضعیف', min: 0, max: 299, color: '#E53935' },
	{ label: 'متوسط', min: 300, max: 499, color: '#FB8C00' },
	{ label: 'قابل قبول', min: 500, max: 649, color: '#FDD835' },
	{ label: 'خوب', min: 650, max: 749, color: '#43A047' },
	{ label: 'عالی', min: 750, max: 900, color: '#26C6DA' }
];

/** ICS person colour groups (250–900). */
const PERSON_BANDS: ScoreBand[] = [
	{ label: 'قرمز', min: 250, max: 459, color: '#E53935' },
	{ label: 'نارنجی', min: 460, max: 519, color: '#FB8C00' },
	{ label: 'زرد', min: 520, max: 579, color: '#FDD835' },
	{ label: 'سبز', min: 580, max: 639, color: '#43A047' },
	{ label: 'آبی', min: 640, max: 900, color: '#26C6DA' }
];

/** ICS legal colour groups (250–900; آبی from 620). */
const LEGAL_BANDS: ScoreBand[] = [
	{ label: 'قرمز', min: 250, max: 459, color: '#E53935' },
	{ label: 'نارنجی', min: 460, max: 519, color: '#FB8C00' },
	{ label: 'زرد', min: 520, max: 574, color: '#FDD835' },
	{ label: 'سبز', min: 575, max: 619, color: '#43A047' },
	{ label: 'آبی', min: 620, max: 900, color: '#26C6DA' }
];

/** ICS cheque colour groups (1–100). */
const CHEQUE_BANDS: ScoreBand[] = [
	{ label: 'قرمز', min: 1, max: 40, color: '#E53935' },
	{ label: 'نارنجی', min: 40, max: 55, color: '#FB8C00' },
	{ label: 'زرد', min: 55, max: 70, color: '#FDD835' },
	{ label: 'سبز', min: 70, max: 85, color: '#43A047' },
	{ label: 'آبی', min: 85, max: 100, color: '#26C6DA' }
];

const GENERIC_GRADIENT: ScoreBand[] = [
	{ label: '', min: 0, max: 33, color: '#E53935' },
	{ label: '', min: 34, max: 55, color: '#FB8C00' },
	{ label: '', min: 56, max: 72, color: '#FDD835' },
	{ label: '', min: 73, max: 88, color: '#43A047' },
	{ label: '', min: 89, max: 100, color: '#26C6DA' }
];

export function parseCreditModel(raw: unknown): CreditModel | null {
	if (raw === 'cheque' || raw === 'person' || raw === 'legal') return raw;
	return null;
}

export function resolveScoreRange(
	model: CreditModel | null,
	params: { min?: number; max?: number }
): { min: number; max: number } {
	const hasMin = typeof params.min === 'number';
	const hasMax = typeof params.max === 'number';
	if (hasMin && hasMax) return { min: params.min as number, max: params.max as number };

	if (model === 'cheque') {
		return { min: hasMin ? (params.min as number) : 1, max: hasMax ? (params.max as number) : 100 };
	}
	if (model === 'person' || model === 'legal') {
		return { min: hasMin ? (params.min as number) : 250, max: hasMax ? (params.max as number) : 900 };
	}
	return { min: hasMin ? (params.min as number) : 0, max: hasMax ? (params.max as number) : 900 };
}

export function resolveBands(model: CreditModel | null, custom?: ScoreBand[]): ScoreBand[] {
	if (custom?.length) return custom;
	if (model === 'cheque') return CHEQUE_BANDS;
	if (model === 'person') return PERSON_BANDS;
	if (model === 'legal') return LEGAL_BANDS;
	return DEFAULT_BANDS;
}

export function bandLabelForScore(score: number, bands: ScoreBand[]): string {
	return bands.find((b) => score >= b.min && score <= b.max)?.label ?? '';
}

export function genericScoreColor(pct: number): string {
	if (pct < 33) return '#E53935';
	if (pct < 55) return '#FB8C00';
	if (pct < 72) return '#FDD835';
	if (pct < 88) return '#43A047';
	return '#26C6DA';
}

export function accentFromScore(
	score: number,
	bands: ScoreBand[],
	pct: number,
	_customBands = false
): string {
	const hit = bands.find((b) => score >= b.min && score <= b.max);
	if (hit?.color) return hit.color;
	return genericScoreColor(pct);
}

export function gradientStops(
	bands: ScoreBand[],
	min: number,
	max: number,
	customBands: boolean
): { offset: number; color: string }[] {
	const source = customBands ? bands : GENERIC_GRADIENT;
	const span = Math.max(1, max - min);
	const stops = source.map((b) => {
		const mid = (b.min + b.max) / 2;
		const offset = Math.max(0, Math.min(100, ((mid - min) / span) * 100));
		return { offset, color: b.color };
	});
	return stops.sort((a, b) => a.offset - b.offset);
}