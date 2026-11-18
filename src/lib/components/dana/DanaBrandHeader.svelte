<script lang="ts">
	import { danaThemePack } from '$lib/dana/theme';

	export let compact = false;

	$: wordmark = $danaThemePack?.redesign?.wordmark;
	$: name = $danaThemePack?.copy?.product_name ?? '';
	$: tagline = $danaThemePack?.copy?.tagline ?? $danaThemePack?.copy?.empty_title ?? '';
</script>

<div class="dana-brand" class:dana-brand--compact={compact} dir="rtl">
	{#if wordmark}
		<img class="dana-brand__wordmark" src={wordmark} alt={name} draggable="false" />
	{:else}
		<h2 class="dana-brand__fallback">{name}</h2>
	{/if}
	{#if tagline}
		<p class="dana-brand__tagline">{tagline}</p>
	{/if}
</div>
