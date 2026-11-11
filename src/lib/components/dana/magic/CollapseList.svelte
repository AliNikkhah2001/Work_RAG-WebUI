<script lang="ts">
	import { resolveMagicVariant } from '$lib/dana/variants';

	type Item = { title: string; body?: string; tag?: string };

	export let params: Record<string, unknown> = {};

	$: title = (params.title as string) || 'فهرست';
	$: items = (Array.isArray(params.items) ? params.items : []) as Item[];
	$: variant = resolveMagicVariant('list', params, 'accordion');
	let open = 0;
</script>

<div class="dana-magic-root dana-list dana-list--{variant}" dir="rtl" data-variant={variant}>
	{#if title}
		<h3 class="dana-list__title">{title}</h3>
	{/if}

	{#if variant === 'grid'}
		<div class="dana-list__grid">
			{#each items as item}
				<article class="dana-list__tile">
					<strong>{item.title}</strong>
					{#if item.tag}<span class="dana-list__tag">{item.tag}</span>{/if}
					{#if item.body}<p>{item.body}</p>{/if}
				</article>
			{/each}
		</div>
	{:else if variant === 'chips'}
		<div class="dana-list__chips">
			{#each items as item}
				<span class="dana-list__chip" title={item.body || ''}>{item.title}</span>
			{/each}
		</div>
	{:else}
		<ul class="dana-list__accordion">
			{#each items as item, i}
				<li class:is-open={open === i}>
					<button type="button" class="dana-list__head" on:click={() => (open = open === i ? -1 : i)}>
						<span>{item.title}</span>
						<span aria-hidden="true">{open === i ? '−' : '+'}</span>
					</button>
					{#if open === i && item.body}
						<div class="dana-list__body">{item.body}</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
