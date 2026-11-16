<script lang="ts">
	import { onMount } from 'svelte';
	import { faNumber } from '$lib/dana/fa';
	import { resolveMagicVariant } from '$lib/dana/variants';
	import {
		MODEL_BADGE,
		MODEL_LABEL,
		parseCreditModel,
		resolveBands,
		resolveScoreRange,
		type ScoreBand
	} from '$lib/dana/creditScoreModel';

	export let params: Record<string, unknown> = {};

	$: model = parseCreditModel(params.model);
	$: customBands = Array.isArray(params.bands) && (params.bands as ScoreBand[]).length > 0;
	$: bands = resolveBands(model, customBands ? (params.bands as ScoreBand[]) : undefined);
	$: score = typeof params.score === 'number' ? (params.score as number) : null;
	$: range = resolveScoreRange(model, {
		min: typeof params.min === 'number' ? (params.min as number) : undefined,
		max: typeof params.max === 'number' ? (params.max as number) : undefined
	});
	$: min = range.min;
	$: max = range.max;
	$: label =
		(params.label as string) ||
		(model ? `سطح امتیاز · ${MODEL_BADGE[model]}` : 'سطح امتیاز');
	$: variant = resolveMagicVariant('bands', params, 'vertical');
	$: bandCount = bands.length;
	$: modelClass = model ? `dana-ladder--model-${model}` : '';

	function bandCodeText(band: ScoreBand): string {
		if (Array.isArray(band.codes) && band.codes.length) return band.codes.join(' · ');
		return band.code ? String(band.code) : '';
	}

	let needlePct = 0;
	let reduced = false;
	let entered = false;
	let mounted = false;
	let raf = 0;

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

	function cancelAnim() {
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
	}

	function animateNeedle(target: number) {
		cancelAnim();
		if (reduced) {
			needlePct = target;
			return;
		}
		const start = performance.now();
		const dur = 1100;
		const tick = (t: number) => {
			const p = Math.min(1, (t - start) / dur);
			const ease = 1 - Math.pow(1 - p, 3);
			needlePct = target * ease;
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
	}

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		mounted = true;
		requestAnimationFrame(() => {
			entered = true;
		});
		return () => cancelAnim();
	});

	$: if (mounted) {
		const target = score === null ? 0 : scoreToPct(score);
		animateNeedle(target);
	}
</script>

{#if variant === 'horizontal'}
	<div
		class="dana-magic-root dana-score-bands-wrap dana-magic-enter"
		class:is-entered={entered}
		dir="rtl"
		data-model={model || undefined}
	>
		{#if model}
			<p class="dana-score-bands__model">
				<span class="dana-score-gauge__model-badge">{MODEL_BADGE[model]}</span>
				{MODEL_LABEL[model]}
			</p>
		{/if}
		<div class="dana-score-bands dana-score-bands--pills" role="list" dir="ltr">
			{#each bands as band, i}
				<span
					class="dana-score-band dana-magic-stagger-item"
					class:is-active={score !== null && score >= band.min && score <= band.max}
					role="listitem"
					style="--band:{band.color};--i:{i}"
					title="{faNumber(band.min)}–{faNumber(band.max)}"
				>
					<span class="dana-score-band__label">{band.label}</span>
					{#if bandCodeText(band)}
						<span class="dana-score-band__code">{bandCodeText(band)}</span>
					{/if}
					<span class="dana-score-band__range tabular-nums"
						>{faNumber(band.min)}–{faNumber(band.max)}</span
					>
				</span>
			{/each}
		</div>
		{#if score !== null}
			<p class="dana-score-bands__current">
				امتیاز فعلی: <strong class="tabular-nums">{faNumber(score)}</strong>
				<span class="dana-score-bands__bounds tabular-nums"
					>({faNumber(min)}–{faNumber(max)})</span
				>
			</p>
		{/if}
	</div>
{:else}
	<div
		class="dana-magic-root dana-ladder {modelClass} dana-magic-enter"
		class:is-entered={entered}
		dir="rtl"
		role="img"
		aria-label="{label}{score !== null ? `: ${faNumber(score)}` : ''}"
		data-variant={variant}
		data-model={model || undefined}
		style="--band-count:{bandCount}"
	>
		<div class="dana-ladder__head">
			<div class="dana-ladder__head-copy">
				{#if model}<span class="dana-score-gauge__model-badge">{MODEL_BADGE[model]}</span>{/if}
				<p class="dana-ladder__label">{label}</p>
			</div>
			{#if score !== null}
				<p class="dana-ladder__score tabular-nums">{faNumber(score)}</p>
			{/if}
		</div>
		<div class="dana-ladder__body">
			<ul class="dana-ladder__labels" aria-hidden="true">
				{#each [...bands].reverse() as band, i}
					<li class="dana-magic-stagger-item" style="--i:{i}">
						<span class="dana-ladder__name">{band.label}</span>
						{#if bandCodeText(band)}
							<span class="dana-ladder__code">{bandCodeText(band)}</span>
						{/if}
						<span class="dana-ladder__range tabular-nums"
							>{faNumber(band.min)}–{faNumber(band.max)}</span
						>
					</li>
				{/each}
			</ul>
			<div class="dana-ladder__track" aria-hidden="true">
				{#each [...bands].reverse() as band, i}
					<span class="dana-ladder__seg dana-magic-stagger-item" style="background:{band.color};--i:{i}"
					></span>
				{/each}
				{#if score !== null}
					<span
						class="dana-ladder__needle"
						class:is-visible={entered}
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