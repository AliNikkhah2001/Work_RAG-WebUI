<script lang="ts">
	type Band = { label: string; min: number; max: number; color: string };
	export let params: Record<string, unknown> = {};
	$: bands = (Array.isArray(params.bands) ? params.bands : []) as Band[];
	$: highlight = typeof params.score === 'number' ? (params.score as number) : null;
</script>

<div class="dana-magic-root">
	<div class="dana-score-bands">
		{#each bands as band}
			<span
				class="dana-score-band"
				style="background:{band.color}; outline:{highlight !== null &&
				highlight >= band.min &&
				highlight <= band.max
					? '2px solid #111'
					: 'none'}"
				title="{band.min}–{band.max}"
			>
				{band.label}
				<span class="opacity-80 text-[0.7rem]">{band.min}–{band.max}</span>
			</span>
		{/each}
	</div>
	{#if highlight !== null}
		<p class="mt-2 text-xs text-gray-600 dark:text-gray-300" dir="rtl">
			امتیاز فعلی: <strong>{highlight}</strong>
		</p>
	{/if}
</div>
