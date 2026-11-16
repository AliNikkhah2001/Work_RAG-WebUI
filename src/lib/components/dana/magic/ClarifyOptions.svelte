<script lang="ts">
	type ClarifyItem = {
		id?: string;
		label: string;
		prompt?: string;
		icon?: string;
		subspace?: string;
	};

	export let params: Record<string, unknown> = {};
	/** Injected from ContentRenderer — fills the chat composer. */
	export let onSelect: (text: string) => void = () => {};

	const ICON_BASE = '/static/dana/brand/icons/magic';

	const DEFAULT_ITEMS: ClarifyItem[] = [
		{
			id: 'person',
			label: 'حقیقی',
			prompt: 'گزارش تسهیلات اشخاص حقیقی',
			icon: 'person',
			subspace: 'facilities_person'
		},
		{
			id: 'legal',
			label: 'حقوقی',
			prompt: 'گزارش تسهیلات اشخاص حقوقی / شرکت‌ها',
			icon: 'legal',
			subspace: 'facilities_company'
		},
		{
			id: 'cheque',
			label: 'چک',
			prompt: 'گزارش چک',
			icon: 'cheque',
			subspace: 'cheque'
		},
		{
			id: 'research',
			label: 'عمومی',
			prompt: 'سؤال عمومی درباره اعتبارسنجی',
			icon: 'research',
			subspace: 'general'
		}
	];

	$: title = (params.title as string) || 'لطفاً نوع گزارش را انتخاب کنید';
	$: items = (
		Array.isArray(params.items) && (params.items as ClarifyItem[]).length
			? (params.items as ClarifyItem[])
			: DEFAULT_ITEMS
	) as ClarifyItem[];

	function iconSrc(item: ClarifyItem): string {
		const key = (item.icon || item.id || 'search').replace(/[^a-z0-9_-]/gi, '');
		return `${ICON_BASE}/${key}.png`;
	}

	function choose(item: ClarifyItem) {
		const text = (item.prompt || item.label || '').trim();
		if (!text) return;
		onSelect(text);
	}
</script>

<div class="dana-magic-root dana-clarify" dir="rtl" data-variant="icons">
	{#if title}
		<p class="dana-clarify__title">{title}</p>
	{/if}
	<div class="dana-clarify__grid" role="group" aria-label={title}>
		{#each items as item, i (item.id || item.label || i)}
			<button
				type="button"
				class="dana-clarify__card"
				on:click={() => choose(item)}
				aria-label={item.label}
			>
				<span class="dana-clarify__icon-wrap">
					<img class="dana-clarify__icon" src={iconSrc(item)} alt="" width="56" height="56" />
				</span>
				<span class="dana-clarify__label">{item.label}</span>
			</button>
		{/each}
	</div>
</div>
