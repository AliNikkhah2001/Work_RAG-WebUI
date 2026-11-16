<script lang="ts">
	type ClarifyItem = {
		id?: string;
		label: string;
		subtitle?: string;
		prompt?: string;
		icon?: string;
		moreLabel?: string;
		subspace?: string;
	};

	export let params: Record<string, unknown> = {};
	/** Injected from ContentRenderer — fills the chat composer. */
	export let onSelect: (text: string) => void = () => {};

	const ICON_BASE = '/static/dana/brand/icons/magic';
	const ICS_CLARIFY = '/static/dana/brand/icons/magic/ics24/clarify';

	const DEFAULT_ITEMS: ClarifyItem[] = [
		{
			id: 'person',
			label: 'گزارش اعتبارسنجی اشخاص حقیقی',
			subtitle: 'اعتبارسنجی وضعیت مالی و اعتباری افراد حقیقی',
			prompt: 'گزارش تسهیلات اشخاص حقیقی',
			icon: 'person',
			subspace: 'facilities_person'
		},
		{
			id: 'legal',
			label: 'گزارش اعتبارسنجی اشخاص حقوقی',
			subtitle: 'اعتبارسنجی وضعیت مالی اشخاص حقوقی',
			prompt: 'گزارش تسهیلات اشخاص حقوقی / شرکت‌ها',
			icon: 'legal',
			subspace: 'facilities_company'
		},
		{
			id: 'cheque',
			label: 'گزارش اعتبارسنجی چک',
			subtitle: 'ارائه گزارش اعتبارسنجی از سوابق چک افراد',
			prompt: 'گزارش چک',
			icon: 'cheque',
			subspace: 'cheque'
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
		if (key === 'person' || key === 'legal' || key === 'cheque') {
			// Prefer ICS24 white-bg PNGs; fall back to legacy magic icons.
			return `${ICS_CLARIFY}/${key}.png`;
		}
		return `${ICON_BASE}/${key}.png`;
	}

	function onImgError(ev: Event, item: ClarifyItem) {
		const img = ev.currentTarget as HTMLImageElement;
		const key = (item.icon || item.id || '').replace(/[^a-z0-9_-]/gi, '');
		const fallback = `${ICON_BASE}/${key}.png`;
		if (img && img.src && !img.src.endsWith(fallback)) {
			img.src = fallback;
		}
	}

	function choose(item: ClarifyItem) {
		const text = (item.prompt || item.label || '').trim();
		if (!text) return;
		onSelect(text);
	}
</script>

<div class="dana-magic-root dana-clarify dana-clarify--ics" dir="rtl" data-variant="cards">
	{#if title}
		<p class="dana-clarify__title">{title}</p>
	{/if}
	<div class="dana-clarify__grid" role="group" aria-label={title}>
		{#each items as item, i (item.id || item.label || i)}
			<button
				type="button"
				class="dana-clarify__card"
				style={`--i:${i}`}
				on:click={() => choose(item)}
				aria-label={item.label}
			>
				<span class="dana-clarify__icon-wrap">
					<img
						class="dana-clarify__icon"
						src={iconSrc(item)}
						alt=""
						width="120"
						height="120"
						loading="eager"
						decoding="async"
						on:error={(e) => onImgError(e, item)}
					/>
				</span>
				<span class="dana-clarify__label">{item.label}</span>
				{#if item.subtitle}
					<span class="dana-clarify__subtitle">{item.subtitle}</span>
				{/if}
				<span class="dana-clarify__more">{item.moreLabel || 'توضیحات بیشتر'}</span>
			</button>
		{/each}
	</div>
</div>
