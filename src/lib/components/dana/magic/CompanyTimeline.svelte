<script lang="ts">
	import { faDigits } from '$lib/dana/fa';

	type Item = { date?: string; title: string; description?: string };

	export let params: Record<string, unknown> = {};

	$: title = (params.title as string) || 'خط زمان';
	$: items = (Array.isArray(params.items) ? params.items : []) as Item[];
	$: activeIndex =
		typeof params.activeIndex === 'number' ? (params.activeIndex as number) : items.length - 1;

	const toFaDate = (d?: string) => (d ? faDigits(d) : '');
</script>

<div class="dana-magic-root dana-timeline" dir="rtl">
	{#if title}
		<h3 class="dana-timeline__title">{title}</h3>
	{/if}
	{#if items.length}
		<ol class="dana-timeline__list">
			{#each items as item, i}
				<li class="dana-timeline__item" class:is-active={i === activeIndex}>
					<span class="dana-timeline__dot" aria-hidden="true"></span>
					<p class="dana-timeline__item-title">{item.title}</p>
					{#if item.date}
						<p class="dana-timeline__date">{toFaDate(item.date)}</p>
					{/if}
					{#if item.description}
						<p class="dana-timeline__desc">{item.description}</p>
					{/if}
				</li>
			{/each}
		</ol>
	{:else}
		<p class="dana-timeline__empty">رویدادی برای نمایش نیست.</p>
	{/if}
</div>
