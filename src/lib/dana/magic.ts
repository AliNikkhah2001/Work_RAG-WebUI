import type { MagicSegment, MagicTokenDef } from './types';

/** Always-on allowlist so widgets compile even if magic-tokens.json is late/missing. */
export const BUILTIN_MAGIC_DEFS: Record<string, MagicTokenDef> = {
	CREDIT_SCORE_GAUGE: { renderer: 'CreditScoreGauge' },
	CREDIT_SCORE_BANDS: { renderer: 'CreditScoreBands' },
	CLARIFY_OPTIONS: { renderer: 'ClarifyOptions' },
	COMPANY_TIMELINE: { renderer: 'CompanyTimeline' },
	SHAREHOLDERS: { renderer: 'ShareholdersRing' },
	CREDITORS: { renderer: 'CreditorsGrid' },
	INFO_BANNER: { renderer: 'InfoBanner' },
	DATA_TABLE: { renderer: 'DataTable' },
	COLLAPSE_LIST: { renderer: 'CollapseList' },
	ANIMATED_LOGO: { renderer: 'AnimatedLogo' },
	BIRTHDAY: { renderer: 'BirthdayCake' }
};

let catalog: Record<string, MagicTokenDef> | null = null;

export function getMagicDefs(
	extra: Record<string, MagicTokenDef> | null | undefined = catalog
): Record<string, MagicTokenDef> {
	return { ...BUILTIN_MAGIC_DEFS, ...(extra || {}) };
}

export async function loadMagicCatalog(): Promise<Record<string, MagicTokenDef>> {
	if (catalog && Object.keys(catalog).length) return getMagicDefs(catalog);
	try {
		const res = await fetch('/static/dana/magic-tokens.json', { cache: 'no-cache' });
		if (!res.ok) return getMagicDefs(catalog);
		catalog = (await res.json()) as Record<string, MagicTokenDef>;
		return getMagicDefs(catalog);
	} catch {
		return getMagicDefs(catalog);
	}
}

/** Reset cache (tests / hot-reload of catalog). */
export function resetMagicCatalog(): void {
	catalog = null;
}

const SIMPLE_RE = /<([A-Z][A-Z0-9_]*)>/g;
const BLOCK_RE = /<<<MAGIC:([A-Z][A-Z0-9_]*)\s*([\s\S]*?)>>>/g;

/** Prefer richer visuals when multiple magic tokens appear in one reply. */
const MAGIC_PRIORITY: Record<string, number> = {
	CREDIT_SCORE_GAUGE: 100,
	SHAREHOLDERS: 90,
	CREDITORS: 88,
	COMPANY_TIMELINE: 80,
	CREDIT_SCORE_BANDS: 60,
	INFO_BANNER: 40,
	BIRTHDAY: 20,
	CLARIFY_OPTIONS: 15
};

/** Tokens allowed alongside the single winning visual (clarify chips). */
const COMPANION_TOKENS = new Set(['CLARIFY_OPTIONS']);

function safeParams(raw: string): Record<string, unknown> {
	const trimmed = raw.trim();
	if (!trimmed) return {};
	try {
		const parsed = JSON.parse(trimmed);
		return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
	} catch {
		return {};
	}
}

function magicPriority(token: string): number {
	return MAGIC_PRIORITY[token] ?? 10;
}

/** Convert post-hoc ``rag.magic`` payload items into renderable segments. */
export function segmentsFromMagicPayload(
	items: Array<{ name?: string; params?: Record<string, unknown> }> | null | undefined,
	defs: Record<string, MagicTokenDef> = {}
): MagicSegment[] {
	if (!items?.length) return [];
	const resolved = getMagicDefs(defs);
	const out: MagicSegment[] = [];
	for (const item of items) {
		const token = String(item?.name || '').trim();
		if (!token || !resolved[token]) continue;
		out.push({
			type: 'magic',
			token,
			params: { ...(resolved[token].params || {}), ...(item.params || {}) },
			renderer: resolved[token].renderer
		});
	}
	return out;
}

/** Merge body-parsed MAGIC with post-hoc rag.magic (payload wins on same token). */
export function mergeMagicSegments(
	fromContent: MagicSegment[],
	fromPayload: MagicSegment[]
): MagicSegment[] {
	if (!fromPayload.length) return fromContent;
	if (!fromContent.length) return fromPayload;
	const payloadTokens = new Set(
		fromPayload.filter((s) => s.type === 'magic').map((s) => (s as Extract<MagicSegment, { type: 'magic' }>).token)
	);
	const kept = fromContent.filter(
		(s) => s.type !== 'magic' || !payloadTokens.has((s as Extract<MagicSegment, { type: 'magic' }>).token)
	);
	// Keep text from content; append payload widgets after text blocks.
	const text = kept.filter((s) => s.type === 'text');
	const contentMagic = kept.filter((s) => s.type === 'magic');
	return [...text, ...fromPayload, ...contentMagic];
}

/** Split assistant content into text + allowlisted magic widget segments. */
export function parseMagicSegments(
	content: string,
	defs: Record<string, MagicTokenDef> = {}
): MagicSegment[] {
	if (!content) return [];
	const resolved = getMagicDefs(defs);

	const marks: { start: number; end: number; token: string; params: Record<string, unknown> }[] =
		[];

	for (const match of content.matchAll(BLOCK_RE)) {
		const token = match[1];
		if (!resolved[token]) continue;
		marks.push({
			start: match.index ?? 0,
			end: (match.index ?? 0) + match[0].length,
			token,
			params: { ...(resolved[token].params || {}), ...safeParams(match[2] || '') }
		});
	}

	for (const match of content.matchAll(SIMPLE_RE)) {
		const token = match[1];
		if (!resolved[token]) continue;
		const start = match.index ?? 0;
		const end = start + match[0].length;
		if (marks.some((m) => start >= m.start && end <= m.end)) continue;
		marks.push({
			start,
			end,
			token,
			params: { ...(resolved[token].params || {}) }
		});
	}

	marks.sort((a, b) => a.start - b.start);

	// One visual magic widget per reply + optional companion clarify chips.
	let keepIdx = -1;
	const companions: number[] = [];
	if (marks.length > 0) {
		for (let i = 0; i < marks.length; i++) {
			if (COMPANION_TOKENS.has(marks[i].token)) {
				companions.push(i);
				continue;
			}
			if (keepIdx < 0) {
				keepIdx = i;
				continue;
			}
			const keep = marks[keepIdx];
			const cand = marks[i];
			const kp = magicPriority(keep.token);
			const cp = magicPriority(cand.token);
			if (cp > kp || (cp === kp && cand.start < keep.start)) keepIdx = i;
		}
		// If only companions exist, keep the first companion as primary.
		if (keepIdx < 0 && companions.length) keepIdx = companions[0];
	}

	const keepSet = new Set<number>();
	if (keepIdx >= 0) keepSet.add(keepIdx);
	for (const i of companions) {
		if (i !== keepIdx) keepSet.add(i);
	}

	const segments: MagicSegment[] = [];
	let cursor = 0;
	for (let i = 0; i < marks.length; i++) {
		const mark = marks[i];
		if (mark.start < cursor) continue;
		if (mark.start > cursor) {
			segments.push({ type: 'text', value: content.slice(cursor, mark.start) });
		}
		if (keepSet.has(i)) {
			segments.push({
				type: 'magic',
				token: mark.token,
				params: mark.params,
				renderer: resolved[mark.token].renderer
			});
		}
		// Extra magic tokens are stripped (not shown as raw markup).
		cursor = mark.end;
	}
	if (cursor < content.length) {
		segments.push({ type: 'text', value: content.slice(cursor) });
	}
	return segments.length ? segments : [{ type: 'text', value: content }];
}
