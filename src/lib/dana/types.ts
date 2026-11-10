export type DanaThemeId = 'ics-maroon' | 'ics-dark' | 'vanilla' | string;

export type DanaThemePack = {
	id: DanaThemeId;
	label_fa: string;
	label_en: string;
	dir: 'rtl' | 'ltr' | null;
	locale: string | null;
	fonts: { sans: string; cssUrl?: string } | null;
	colors: Record<string, string>;
	logo: string | null;
	favicon: string | null;
	keyvisual: string | null;
	splash: { webm?: string; gif?: string } | null;
	chat_background?: { webm?: string; gif?: string } | null;
	copy: Record<string, string>;
	component_tokens: Record<string, string>;
	feedback: { show_useful?: boolean; show_report?: boolean };
};

export type MagicTokenDef = {
	renderer: string;
	description?: string;
	paramsSchema?: string;
	params?: Record<string, unknown>;
};

export type MagicSegment =
	| { type: 'text'; value: string }
	| { type: 'magic'; token: string; params: Record<string, unknown>; renderer: string };
