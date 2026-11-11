<script lang="ts">
	import BirthdayCake from './BirthdayCake.svelte';
	import CreditScoreBands from './CreditScoreBands.svelte';
	import CreditScoreGauge from './CreditScoreGauge.svelte';
	import CompanyTimeline from './CompanyTimeline.svelte';
	import InfoBanner from './InfoBanner.svelte';
	import DataTable from './DataTable.svelte';
	import CollapseList from './CollapseList.svelte';
	import AnimatedLogo from './AnimatedLogo.svelte';

	export let renderer: string;
	export let params: Record<string, unknown> = {};

	const registry: Record<string, any> = {
		BirthdayCake,
		CreditScoreBands,
		CreditScoreGauge,
		CompanyTimeline,
		InfoBanner,
		DataTable,
		CollapseList,
		AnimatedLogo
	};

	$: Comp = registry[renderer];
</script>

{#if Comp}
	<svelte:component this={Comp} {params} />
{:else}
	<!-- Unknown renderer: fail closed (show nothing interactive) -->
	<code class="text-xs opacity-60">&lt;{renderer}&gt;</code>
{/if}
