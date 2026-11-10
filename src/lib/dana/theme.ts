import { derived, get, writable } from 'svelte/store';
import { WEBUI_NAME, config, settings, showSidebar, showTabs } from '$lib/stores';
import { changeLanguage } from '$lib/i18n';
import { setTextScale } from '$lib/utils/text-scale';
import type { DanaThemeId, DanaThemePack } from './types';

export const DANA_THEME_IDS = ['ics-maroon', 'ics-gauge', 'vanilla'] as const;
export const DANA_DEFAULT_THEME: DanaThemeId = 'ics-maroon';
export const DANA_STORAGE_KEY = 'dana.theme_id';

export const danaThemeId = writable<DanaThemeId>(DANA_DEFAULT_THEME);
export const danaThemePack = writable<DanaThemePack | null>(null);
export const danaReady = writable(false);

const packCache = new Map<string, DanaThemePack>();

export async function loadThemePack(id: DanaThemeId): Promise<DanaThemePack> {
	if (packCache.has(id)) return packCache.get(id)!;
	const res = await fetch(`/static/dana/themes/${id}.json`, { cache: 'no-cache' });
	if (!res.ok) throw new Error(`Dana theme pack not found: ${id}`);
	const pack = (await res.json()) as DanaThemePack;
	packCache.set(id, pack);
	return pack;
}

function clearDanaCssVars(root: HTMLElement) {
	for (const name of [...root.style]) {
		if (name.startsWith('--dana-')) root.style.removeProperty(name);
	}
}

function ensureStylesheet(id: string, href: string) {
	let el = document.getElementById(id) as HTMLLinkElement | null;
	if (!el) {
		el = document.createElement('link');
		el.id = id;
		el.rel = 'stylesheet';
		document.head.appendChild(el);
	}
	el.href = href;
}

function removeStylesheet(id: string) {
	document.getElementById(id)?.remove();
}

export function resolveInitialDanaThemeId(): DanaThemeId {
	const fromConfig = (get(config) as any)?.ui?.default_interface_settings?.dana_theme_id;
	const fromStorage = localStorage.getItem(DANA_STORAGE_KEY);
	const candidate = (fromConfig || fromStorage || DANA_DEFAULT_THEME) as string;
	return (DANA_THEME_IDS as readonly string[]).includes(candidate)
		? (candidate as DanaThemeId)
		: DANA_DEFAULT_THEME;
}

export async function applyDanaTheme(id: DanaThemeId = resolveInitialDanaThemeId()): Promise<void> {
	const pack = await loadThemePack(id);
	const root = document.documentElement;
	clearDanaCssVars(root);

	danaThemeId.set(pack.id);
	danaThemePack.set(pack);
	localStorage.setItem(DANA_STORAGE_KEY, pack.id);

	if (pack.id === 'vanilla') {
		root.classList.remove('dana-theme');
		root.removeAttribute('data-dana-theme');
		removeStylesheet('dana-brand-css');
		removeStylesheet('dana-font-css');
		setTextScale(1);
		danaReady.set(true);
		return;
	}

	root.classList.add('dana-theme');
	root.setAttribute('data-dana-theme', pack.id);

	// Immersive chat chrome: no left/right side panels
	showSidebar.set(false);
	showTabs.set(false);
	setTextScale(1.28);

	for (const [k, v] of Object.entries(pack.colors || {})) {
		root.style.setProperty(k, v);
	}
	if (pack.fonts?.sans) {
		root.style.setProperty('--dana-font-sans', pack.fonts.sans);
	}
	if (pack.component_tokens?.input_radius) {
		root.style.setProperty('--dana-input-radius', pack.component_tokens.input_radius);
	}
	if (pack.component_tokens?.button_radius) {
		root.style.setProperty('--dana-button-radius', pack.component_tokens.button_radius);
	}

	ensureStylesheet('dana-brand-css', '/static/dana/dana.css');
	if (pack.fonts?.cssUrl) {
		ensureStylesheet('dana-font-css', pack.fonts.cssUrl);
	}

	if (pack.dir) {
		root.setAttribute('dir', pack.dir);
		root.lang = pack.locale?.split('-')[0] || 'fa';
	}
	if (pack.locale) {
		try {
			await changeLanguage(pack.locale);
		} catch {
			/* locale optional */
		}
	}

	if (pack.copy?.product_name) {
		WEBUI_NAME.set(pack.copy.product_name);
		document.title = pack.copy.product_name;
	}

	// Force RTL chat when Dana brand themes are active
	const current = get(settings) || {};
	if (pack.dir === 'rtl' && current.chatDirection !== 'RTL') {
		settings.set({ ...current, chatDirection: 'RTL' });
	}

	if (pack.favicon) {
		const fav = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
		if (fav) fav.href = pack.favicon;
	}

	danaReady.set(true);
}

export async function setDanaThemeId(id: DanaThemeId): Promise<void> {
	if (!(DANA_THEME_IDS as readonly string[]).includes(id)) {
		throw new Error(`Unsupported Dana theme: ${id}`);
	}
	await applyDanaTheme(id);
}

export const isDanaBranded = derived(danaThemeId, ($id) => $id !== 'vanilla');
