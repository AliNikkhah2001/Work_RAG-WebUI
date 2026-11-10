<script lang="ts">
	import { faNumber } from '$lib/dana/fa';

	type Band = { label: string; min: number; max: number; color: string };
	export let params: Record<string, unknown> = {};
	$: bands = (Array.isArray(params.bands) ? params.bands : []) as Band[];
	$: highlight = typeof params.score === 'number' ? (params.score as number) : null;
</script>

<div class="dana-magic-root dana-score-bands-wrap" dir="rtl">
	<div class="dana-score-bands" role="list">
		{#each bands as band}
			<span
				class="dana-score-band"
				class:is-active={highlight !== null && highlight >= band.min && highlight <= band.max}
				role="listitem"
				style="--band:{band.color}"
				title="{faNumber(band.min)}–{faNumber(band.max)}"
			>
				<span class="dana-score-band__label">{band.label}</span>
				<span class="dana-score-band__range tabular-nums"
					>{faNumber(band.min)}–{faNumber(band.max)}</span
				>
			</span>
		{/each}
	</div>
	{#if highlight !== null}
		<p class="dana-score-bands__current">
			امتیاز فعلی: <strong class="tabular-nums">{faNumber(highlight)}</strong>
		</p>
	{/if}
</div>
