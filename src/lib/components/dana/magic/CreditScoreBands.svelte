<script lang="ts">
	import { onMount } from 'svelte';
	import { faNumber } from '$lib/dana/fa';
	import { resolveMagicVariant } from '$lib/dana/variants';

	type Band = { label: string; min: number; max: number; color: string };
	export let params: Record<string, unknown> = {};

	const DEFAULT_BANDS: Band[] = [
		{ label: 'ضعیف', min: 0, max: 299, color: '#E53935' },
		{ label: 'متوسط', min: 300, max: 499, color: '#FB8C00' },
		{ label: 'قابل قبول', min: 500, max: 649, color: '#FDD835' },
		{ label: 'خوب', min: 650, max: 749, color: '#43A047' },
		{ label: 'عالی', min: 750, max: 900, color: '#26C6DA' }
	];

	$: bands = (
		Array.isArray(params.bands) && (params.bands as Band[]).length
			? (params.bands as Band[])
			: DEFAULT_BANDS
	) as Band[];
	$: score = typeof params.score === 'number' ? (params.score as number) : null;
	$: min = typeof params.min === 'number' ? (params.min as number) : (bands[0]?.min ?? 0);
	$: max =
		typeof params.max === 'number'
			? (params.max as number)
			: (bands[bands.length - 1]?.max ?? 900);
	$: label = (params.label as string) || 'سطح امتیاز';
	$: variant = resolveMagicVariant('bands', params, 'vertical');

	let needlePct = 0;
	let reduced = false;

	/** Map score onto equal-height ladder segments (not linear 0–max). */
	function scoreToPct(value: number): number {
		if (!bands.length) return 0;
		const n = bands.length;
		let idx = bands.findIndex((b) => value >= b.min && value <= b.max);
		if (idx < 0) idx = value < bands[0].min ? 0 : n - 1;
		const b = bands[idx];
		const span = Math.max(1, b.max - b.min);
		const frac = Math.max(0, Math.min(1, (value - b.min) / span));
		return ((idx + frac) / n) * 100;
	}

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const target = score === null ? 0 : scoreToPct(score);
		if (reduced) {
			needlePct = target;
			return;
		}
		const start = performance.now();
		const dur = 1100;
		let raf = 0;
		const tick = (t: number) => {
			const p = Math.min(1, (t - start) / dur);
			const ease = 1 - Math.pow(1 - p, 3);
			needlePct = target * ease;
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

{#if variant === 'horizontal'}
	<div class="dana-magic-root dana-score-bands-wrap" dir="rtl">
		<div class="dana-score-bands dana-score-bands--pills" role="list">
			{#each bands as band}
				<span
					class="dana-score-band"
					class:is-active={score !== null && score >= band.min && score <= band.max}
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
		{#if score !== null}
			<p class="dana-score-bands__current">
				امتیاز فعلی: <strong class="tabular-nums">{faNumber(score)}</strong>
			</p>
		{/if}
	</div>
{:else}
	<!-- Gauge A: solid vertical ladder + sliding needle (no glass) -->
	<div
		class="dana-magic-root dana-ladder"
		dir="rtl"
		role="img"
		aria-label="{label}{score !== null ? `: ${faNumber(score)}` : ''}"
		data-variant={variant}
	>
		<div class="dana-ladder__head">
			<p class="dana-ladder__label">{label}</p>
			{#if score !== null}
				<p class="dana-ladder__score tabular-nums">{faNumber(score)}</p>
			{/if}
		</div>
		<div class="dana-ladder__body">
			<ul class="dana-ladder__labels" aria-hidden="true">
				{#each [...bands].reverse() as band}
					<li>
						<span class="dana-ladder__name">{band.label}</span>
						<span class="dana-ladder__range tabular-nums"
							>{faNumber(band.min)}–{faNumber(band.max)}</span
						>
					</li>
				{/each}
			</ul>
			<div class="dana-ladder__track" aria-hidden="true">
				{#each [...bands].reverse() as band}
					<span class="dana-ladder__seg" style="background:{band.color}"></span>
				{/each}
				{#if score !== null}
					<span
						class="dana-ladder__needle"
						style="bottom: calc({needlePct}% - 1px)"
						title={faNumber(score)}
					>
						<span class="dana-ladder__needle-cap dana-ladder__needle-cap--start"></span>
						<span class="dana-ladder__needle-bar"></span>
						<span class="dana-ladder__needle-cap dana-ladder__needle-cap--end"></span>
						<span class="dana-ladder__needle-tip" aria-hidden="true"></span>
					</span>
				{/if}
			</div>
		</div>
	</div>
{/if}
