<script lang="ts">
	import BirthdayCake from './BirthdayCake.svelte';
	import CreditScoreBands from './CreditScoreBands.svelte';
	import CreditScoreGauge from './CreditScoreGauge.svelte';
	import CompanyTimeline from './CompanyTimeline.svelte';
	import InfoBanner from './InfoBanner.svelte';
	import DataTable from './DataTable.svelte';
	import CollapseList from './CollapseList.svelte';
	import AnimatedLogo from './AnimatedLogo.svelte';
	import ClarifyOptions from './ClarifyOptions.svelte';
	import ShareholdersRing from './ShareholdersRing.svelte';
	import CreditorsGrid from './CreditorsGrid.svelte';

	export let renderer: string;
	export let params: Record<string, unknown> = {};
	export let onSelect: (text: string) => void = () => {};

	const registry: Record<string, any> = {
		BirthdayCake,
		CreditScoreBands,
		CreditScoreGauge,
		CompanyTimeline,
		InfoBanner,
		DataTable,
		CollapseList,
		AnimatedLogo,
		ClarifyOptions,
		ShareholdersRing,
		CreditorsGrid
	};

	$: Comp = registry[renderer];
</script>

{#if Comp}
	{#if renderer === 'ClarifyOptions'}
		<svelte:component this={Comp} {params} {onSelect} />
	{:else}
		<svelte:component this={Comp} {params} />
	{/if}
{:else}
	<!-- Unknown renderer: fail closed (show nothing interactive) -->
	<code class="text-xs opacity-60">&lt;{renderer}&gt;</code>
{/if}
