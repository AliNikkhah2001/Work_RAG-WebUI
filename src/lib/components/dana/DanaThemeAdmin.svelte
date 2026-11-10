<script lang="ts">
	import { onMount } from 'svelte';
	import { DANA_THEME_IDS, danaThemeId, loadThemePack, setDanaThemeId } from '$lib/dana/theme';
	import type { DanaThemePack } from '$lib/dana/types';

	export let themeId: string = 'ics-maroon';
	export let onChange: (id: string) => void = () => {};

	let packs: DanaThemePack[] = [];
	let saving = false;
	let error = '';

	onMount(async () => {
		packs = await Promise.all(DANA_THEME_IDS.map((id) => loadThemePack(id)));
	});

	const select = async (id: string) => {
		if (saving) return;
		saving = true;
		error = '';
		try {
			await setDanaThemeId(id);
			themeId = id;
			onChange(id);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	};
</script>

<div class="space-y-2" dir="rtl">
	<div class="text-sm font-medium text-gray-700 dark:text-gray-200">پوسته دانا (فقط ادمین)</div>
	<p class="text-xs text-gray-500 dark:text-gray-400">
		تا ۳ پوسته برند ICS. انتخاب «پیش‌فرض Open WebUI» برند دانا را غیرفعال می‌کند.
	</p>
	<div class="flex flex-wrap gap-2">
		{#each packs as pack}
			<button
				type="button"
				class="rounded-lg border px-3 py-2 text-xs transition {$danaThemeId === pack.id ||
				themeId === pack.id
					? 'border-[color:var(--dana-primary,#BA0C54)] bg-[color:var(--dana-primary,#BA0C54)] text-white'
					: 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200'}"
				disabled={saving}
				on:click={() => select(pack.id)}
			>
				{pack.label_fa}
				<span class="opacity-70">({pack.label_en})</span>
			</button>
		{/each}
	</div>
	{#if error}
		<p class="text-xs text-red-500">{error}</p>
	{/if}
</div>
