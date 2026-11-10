import type { MagicSegment, MagicTokenDef } from './types';

let catalog: Record<string, MagicTokenDef> | null = null;

export async function loadMagicCatalog(): Promise<Record<string, MagicTokenDef>> {
	if (catalog) return catalog;
	const res = await fetch('/static/dana/magic-tokens.json', { cache: 'no-cache' });
	if (!res.ok) {
		catalog = {};
		return catalog;
	}
	catalog = (await res.json()) as Record<string, MagicTokenDef>;
	return catalog;
}

const SIMPLE_RE = /<([A-Z][A-Z0-9_]*)>/g;
const BLOCK_RE = /<<<MAGIC:([A-Z][A-Z0-9_]*)\s*([\s\S]*?)>>>/g;

/** Prefer richer visuals when multiple magic tokens appear in one reply. */
const MAGIC_PRIORITY: Record<string, number> = {
	CREDIT_SCORE_GAUGE: 100,
	COMPANY_TIMELINE: 80,
	CREDIT_SCORE_BANDS: 60,
	INFO_BANNER: 40,
	BIRTHDAY: 20
};

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

	// One magic widget per assistant reply — pick highest-priority mark.
	let keepIdx = -1;
	if (marks.length > 0) {
		keepIdx = 0;
		for (let i = 1; i < marks.length; i++) {
			const keep = marks[keepIdx];
			const cand = marks[i];
			const kp = magicPriority(keep.token);
			const cp = magicPriority(cand.token);
			if (cp > kp || (cp === kp && cand.start < keep.start)) keepIdx = i;
		}
	}

	const segments: MagicSegment[] = [];
	let cursor = 0;
	for (let i = 0; i < marks.length; i++) {
		const mark = marks[i];
		if (mark.start < cursor) continue;
		if (mark.start > cursor) {
			segments.push({ type: 'text', value: content.slice(cursor, mark.start) });
		}
		if (i === keepIdx) {
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
