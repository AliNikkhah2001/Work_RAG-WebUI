import { get } from 'svelte/store';
import { danaThemePack } from './theme';

export type MagicKind = 'gauge' | 'timeline' | 'table' | 'list' | 'logo';

/** Resolve magic skin: per-token params.variant > theme pack > DOM data attr > default. */
export function resolveMagicVariant(
	kind: MagicKind,
	params: Record<string, unknown> = {},
	fallback: string
): string {
	const fromParams = typeof params.variant === 'string' ? params.variant.trim() : '';
	if (fromParams) return fromParams;

	const pack = get(danaThemePack) as any;
	const fromPack = pack?.magic_variants?.[kind];
	if (typeof fromPack === 'string' && fromPack) return fromPack;

	if (typeof document !== 'undefined') {
		const fromDom = document.documentElement.getAttribute(`data-dana-magic-${kind}`);
		if (fromDom) return fromDom;
	}

	return fallback;
}
