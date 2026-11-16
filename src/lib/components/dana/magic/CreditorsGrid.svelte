<script lang="ts">
	import { onMount } from 'svelte';

	type Creditor = { id?: string; name: string; logo?: string | null };
	type Tab = { id: string; label: string };

	export let params: Record<string, unknown> = {};

	const DEFAULT_TABS: Tab[] = [
		{ id: 'banks', label: 'بانک ها' },
		{ id: 'orgs', label: 'سازمان ها' },
		{ id: 'insurance', label: 'بیمه ها' },
		{ id: 'leasing', label: 'لیزینگ ها' },
		{ id: 'lendtech', label: 'لندتک ها' }
	];

	let catalogTabs: Tab[] = DEFAULT_TABS;
	let catalogGroups: Record<string, Creditor[]> = {};
	let loaded = false;
	let activeTab = 'banks';
	let animKey = 0;

	$: title = (params.title as string) || 'تأمین‌کنندگان داده‌های شرکت اعتبارسنجی ایران';
	$: paramTabs = (Array.isArray(params.tabs) ? params.tabs : []) as Tab[];
	$: paramGroups = (params.groups && typeof params.groups === 'object'
		? (params.groups as Record<string, Creditor[]>)
		: {}) as Record<string, Creditor[]>;
	$: tabs = paramTabs.length ? paramTabs : catalogTabs;
	$: groups = Object.keys(paramGroups).length ? paramGroups : catalogGroups;
	$: items = groups[activeTab] || [];

	function selectTab(id: string) {
		if (id === activeTab) return;
		activeTab = id;
		animKey += 1;
	}

	onMount(() => {
		let cancelled = false;
		(async () => {
			if (Object.keys(paramGroups).length) {
				loaded = true;
				if (tabs[0]) activeTab = tabs[0].id;
				return;
			}
			try {
				const res = await fetch('/static/dana/magic-data/creditors.json', { cache: 'force-cache' });
				if (res.ok) {
					const data = await res.json();
					if (!cancelled) {
						if (Array.isArray(data.tabs)) catalogTabs = data.tabs as Tab[];
						if (data.groups && typeof data.groups === 'object') {
							catalogGroups = data.groups as Record<string, Creditor[]>;
						}
						activeTab = (catalogTabs[0] || DEFAULT_TABS[0]).id;
					}
				}
			} catch {
				/* keep empty */
			} finally {
				if (!cancelled) loaded = true;
			}
		})();
		return () => {
			cancelled = true;
		};
	});
</script>

<div class="dana-magic-root dana-creditors dana-creditors--solid" dir="rtl" data-variant="tabs">
	{#if title}
		<h3 class="dana-creditors__title">{title}</h3>
	{/if}

	<div class="dana-creditors__tabs" role="tablist" aria-label={title}>
		{#each tabs as tab}
			<button
				type="button"
				class="dana-creditors__tab"
				class:is-active={tab.id === activeTab}
				role="tab"
				aria-selected={tab.id === activeTab}
				on:click={() => selectTab(tab.id)}
			>
				{tab.label}
			</button>
		{/each}
	</div>

	{#if !loaded}
		<p class="dana-creditors__empty">در حال بارگذاری…</p>
	{:else if !items.length}
		<p class="dana-creditors__empty">موردی در این دسته نیست.</p>
	{:else}
		<div class="dana-creditors__grid" role="tabpanel" aria-label={tabs.find((t) => t.id === activeTab)?.label || ''} data-key={animKey}>
			{#each items as item (item.id || item.name)}
				<div class="dana-creditors__card" title={item.name}>
					{#if item.logo}
						<img class="dana-creditors__logo" src={item.logo} alt="" loading="lazy" width="60" height="60" />
					{:else}
						<span class="dana-creditors__fallback" aria-hidden="true">{item.name.slice(0, 1)}</span>
					{/if}
					<span class="dana-creditors__name">{item.name}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
