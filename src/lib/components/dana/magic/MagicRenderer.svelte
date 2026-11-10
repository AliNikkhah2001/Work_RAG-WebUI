<script lang="ts">
	import BirthdayCake from './BirthdayCake.svelte';
	import CreditScoreBands from './CreditScoreBands.svelte';
	import InfoBanner from './InfoBanner.svelte';

	export let renderer: string;
	export let params: Record<string, unknown> = {};

	const registry: Record<string, any> = {
		BirthdayCake,
		CreditScoreBands,
		InfoBanner
	};

	$: Comp = registry[renderer];
</script>

{#if Comp}
	<svelte:component this={Comp} {params} />
{:else}
	<!-- Unknown renderer: fail closed (show nothing interactive) -->
	<code class="text-xs opacity-60">&lt;{renderer}&gt;</code>
{/if}
