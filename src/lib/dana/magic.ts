import type { MagicSegment, MagicTokenDef } from './types';

let catalog: Record<string, MagicTokenDef> | null = null;

export async function loadMagicCatalog(): Promise<Record<string, MagicTokenDef>> {
	if (catalog && Object.keys(catalog).length) return catalog;
	const res = await fetch('/static/dana/magic-tokens.json', { cache: 'no-cache' });
	if (!res.ok) {
		// Do not cache failures — allow a later retry once static assets are ready.
		return catalog ?? {};
	}
	catalog = (await res.json()) as Record<string, MagicTokenDef>;
	return catalog;
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

/** Split assistant content into text + allowlisted magic widget segments. */
export function parseMagicSegments(
	content: string,
	defs: Record<string, MagicTokenDef>
): MagicSegment[] {
	if (!content) return [];

	const marks: { start: number; end: number; token: string; params: Record<string, unknown> }[] =
		[];

	for (const match of content.matchAll(BLOCK_RE)) {
		const token = match[1];
		if (!defs[token]) continue;
		marks.push({
			start: match.index ?? 0,
			end: (match.index ?? 0) + match[0].length,
			token,
			params: { ...(defs[token].params || {}), ...safeParams(match[2] || '') }
		});
	}

	for (const match of content.matchAll(SIMPLE_RE)) {
		const token = match[1];
		if (!defs[token]) continue;
		const start = match.index ?? 0;
		const end = start + match[0].length;
		if (marks.some((m) => start >= m.start && end <= m.end)) continue;
		marks.push({
			start,
			end,
			token,
			params: { ...(defs[token].params || {}) }
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
				renderer: defs[mark.token].renderer
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
