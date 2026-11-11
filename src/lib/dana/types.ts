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
	chat_background?: { webm?: string; gif?: string; image?: string; still?: string } | null;
	copy: Record<string, string>;
	/** ICS/credit starter prompts; overrides Open WebUI stock suggestions when present. */
	prompt_suggestions?: Array<{
		title: [string, string] | string[];
		content: string;
		id?: string;
	}>;
	/** Default magic widget skins: gauge/timeline/table/list/logo variant ids. */
	magic_variants?: Partial<
		Record<'gauge' | 'timeline' | 'table' | 'list' | 'logo', string>
	>;
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
