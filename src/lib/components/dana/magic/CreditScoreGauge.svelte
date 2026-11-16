<script lang="ts">
	import { onMount } from 'svelte';
	import { faNumber, faPercent } from '$lib/dana/fa';
	import { resolveMagicVariant } from '$lib/dana/variants';
	import {
		MODEL_BADGE,
		MODEL_LABEL,
		accentFromScore,
		bandLabelForScore,
		gradientStops,
		parseCreditModel,
		resolveBands,
		resolveScoreRange,
		type ScoreBand
	} from '$lib/dana/creditScoreModel';

	export let params: Record<string, unknown> = {};

	$: model = parseCreditModel(params.model);
	$: customBands = Array.isArray(params.bands) && (params.bands as ScoreBand[]).length > 0;
	$: bands = resolveBands(model, customBands ? (params.bands as ScoreBand[]) : undefined);
	$: score = typeof params.score === 'number' ? (params.score as number) : model === 'cheque' ? 72 : 610;
	$: range = resolveScoreRange(model, {
		min: typeof params.min === 'number' ? (params.min as number) : undefined,
		max: typeof params.max === 'number' ? (params.max as number) : undefined
	});
	$: min = range.min;
	$: max = range.max;
	$: label =
		(params.label as string) ||
		(model ? MODEL_LABEL[model] : 'امتیاز اعتباری');
	$: band =
		(params.band as string) ||
		(customBands || model ? bandLabelForScore(score, bands) : '');
	$: pct = Math.max(0, Math.min(100, ((score - min) / Math.max(1, max - min)) * 100));
	$: variant = resolveMagicVariant('gauge', params, 'ring');
	$: stops = gradientStops(bands, min, max, customBands);
	$: gradId = `dana-g-${model ?? 'x'}-${variant}-${score}`;
	$: modelClass = model ? `dana-score-gauge--model-${model}` : '';
	$: compactClass = model === 'cheque' ? 'dana-score-gauge--compact' : '';

	const ARC_LEN = 251.327;

	let shownPct = 0;
	let shownScore = 0;
	let reduced = false;
	let bandVisible = false;
	let mounted = false;
	let raf = 0;

	$: accent = accentFromScore(score, bands, pct, customBands);

	function cancelAnim() {
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
	}

	function animateTo(targetPct: number, targetScore: number) {
		cancelAnim();
		bandVisible = false;
		if (reduced) {
			shownPct = targetPct;
			shownScore = targetScore;
			bandVisible = Boolean(band);
			return;
		}
		const start = performance.now();
		const dur = 1200;
		const tick = (t: number) => {
			const p = Math.min(1, (t - start) / dur);
			const ease = 1 - Math.pow(1 - p, 3);
			shownPct = targetPct * ease;
			shownScore = Math.round(targetScore * ease);
			if (p < 1) {
				raf = requestAnimationFrame(tick);
			} else {
				bandVisible = Boolean(band);
			}
		};
		raf = requestAnimationFrame(tick);
	}

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		mounted = true;
		return () => cancelAnim();
	});

	$: if (mounted) animateTo(pct, score);

	$: dotAngle = Math.PI - (Math.PI * shownPct) / 100;
	$: dotX = 100 + 80 * Math.cos(dotAngle);
	$: dotY = 100 - 80 * Math.sin(dotAngle);
	$: tipColor = accent;
</script>

{#if variant === 'hero'}
	<div
		class="dana-magic-root dana-score-gauge dana-score-gauge--hero dana-score-gauge--solid {modelClass} {compactClass}"
		dir="rtl"
		role="img"
		aria-label="{label}: {faNumber(score)} از {faNumber(max)}"
		data-variant={variant}
		data-model={model || undefined}
	>
		{#if model}
			<span class="dana-score-gauge__model-badge">{MODEL_BADGE[model]}</span>
		{/if}
		<div class="dana-score-gauge__hero">
			<span class="dana-score-gauge__score dana-score-gauge__score--xl tabular-nums"
				>{faNumber(shownScore)}</span
			>
			<p class="dana-score-gauge__label">{label}</p>
			{#if band}
				<p
					class="dana-score-gauge__band"
					class:is-visible={bandVisible}
					style="background:{accent}"
				>
					{band}
				</p>
			{/if}
			<div class="dana-score-gauge__bar" aria-hidden="true">
				<span style="width:{shownPct}%;background:{accent}"></span>
			</div>
			<p class="dana-score-gauge__range">بازه {faNumber(min)} تا {faNumber(max)}</p>
		</div>
	</div>
{:else if variant === 'horizontal'}
	<div
		class="dana-magic-root dana-score-gauge dana-score-gauge--horizontal dana-score-gauge--solid {modelClass} {compactClass}"
		dir="rtl"
		role="img"
		aria-label="{label}: {faNumber(score)}"
		data-variant={variant}
		data-model={model || undefined}
	>
		<div class="dana-score-gauge__hhead">
			<div class="dana-score-gauge__hmeta">
				{#if model}<span class="dana-score-gauge__model-badge">{MODEL_BADGE[model]}</span>{/if}
				<p class="dana-score-gauge__label">{label}</p>
			</div>
			<span class="dana-score-gauge__score tabular-nums">{faNumber(shownScore)}</span>
		</div>
		<div
			class="dana-score-gauge__htrack"
			role="progressbar"
			aria-valuenow={score}
			aria-valuemin={min}
			aria-valuemax={max}
		>
			<span class="dana-score-gauge__htrack-rail" aria-hidden="true"></span>
			<span
				class="dana-score-gauge__htrack-fill"
				style="width:{shownPct}%;background:linear-gradient(90deg,{stops
					.map((s) => `${s.color} ${s.offset}%`)
					.join(',')})"
				aria-hidden="true"
			></span>
			<span
				class="dana-score-gauge__htrack-tip"
				style="inset-inline-start:calc({shownPct}% - 9px);border-color:{tipColor};background:{tipColor}"
				aria-hidden="true"
			></span>
		</div>
		<div class="dana-score-gauge__hfoot">
			<span class="dana-score-gauge__range tabular-nums">{faNumber(min)}</span>
			{#if band}
				<span class="dana-score-gauge__band" class:is-visible={bandVisible} style="background:{accent}"
					>{band}</span
				>
			{/if}
			<span class="dana-score-gauge__range tabular-nums">{faNumber(max)}</span>
		</div>
	</div>
{:else if variant === 'vertical'}
	<div
		class="dana-magic-root dana-score-gauge dana-score-gauge--vertical dana-score-gauge--solid {modelClass} {compactClass}"
		dir="rtl"
		role="img"
		aria-label="{label}: {faNumber(score)}"
		data-variant={variant}
		data-model={model || undefined}
	>
		<div
			class="dana-score-gauge__vtrack-wrap"
			role="progressbar"
			aria-valuenow={score}
			aria-valuemin={min}
			aria-valuemax={max}
		>
			<div class="dana-score-gauge__vtrack" aria-hidden="true">
				<span class="dana-score-gauge__vrail"></span>
				<span
					class="dana-score-gauge__vfill"
					style="height:{shownPct}%;background:linear-gradient(0deg,{stops
						.map((s) => `${s.color} ${100 - s.offset}%`)
						.join(',')})"
				></span>
				<span class="dana-score-gauge__vbulb" style="border-color:{tipColor}"></span>
			</div>
			<span class="dana-score-gauge__vmax tabular-nums">{faNumber(max)}</span>
			<span class="dana-score-gauge__vmin tabular-nums">{faNumber(min)}</span>
		</div>
		<div class="dana-score-gauge__copy">
			{#if model}<span class="dana-score-gauge__model-badge">{MODEL_BADGE[model]}</span>{/if}
			<span class="dana-score-gauge__score dana-score-gauge__score--lg tabular-nums"
				>{faNumber(shownScore)}</span
			>
			<p class="dana-score-gauge__label">{label}</p>
			{#if band}
				<p class="dana-score-gauge__band" class:is-visible={bandVisible} style="background:{accent}">
					{band}
				</p>
			{/if}
		</div>
	</div>
{:else if variant === 'arc'}
	<div
		class="dana-magic-root dana-score-gauge dana-score-gauge--arc dana-score-gauge--solid {modelClass} {compactClass}"
		dir="rtl"
		role="img"
		aria-label="{label}: {faNumber(score)}"
		data-variant={variant}
		data-model={model || undefined}
	>
		<div
			class="dana-score-gauge__arcbar"
			role="progressbar"
			aria-valuenow={score}
			aria-valuemin={min}
			aria-valuemax={max}
		>
			<svg viewBox="0 0 200 120" class="dana-score-gauge__arc-svg" aria-hidden="true">
				<defs>
					<linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
						{#each stops as stop}
							<stop offset="{stop.offset}%" stop-color={stop.color} />
						{/each}
					</linearGradient>
				</defs>
				<path
					d="M20 100 A80 80 0 0 1 180 100"
					fill="none"
					stroke="#ECEFF1"
					stroke-width="14"
					stroke-linecap="round"
				/>
				<path
					d="M20 100 A80 80 0 0 1 180 100"
					fill="none"
					stroke="url(#{gradId})"
					stroke-width="14"
					stroke-linecap="round"
					stroke-dasharray={ARC_LEN}
					stroke-dashoffset={ARC_LEN - (ARC_LEN * shownPct) / 100}
					class="dana-score-gauge__arc"
				/>
				<circle cx={dotX} cy={dotY} r="7" fill="#fff" stroke="#263238" stroke-width="2" />
			</svg>
			<div class="dana-score-gauge__arc-center">
				<span class="dana-score-gauge__score tabular-nums">{faNumber(shownScore)}</span>
				<span class="dana-score-gauge__meta">{faPercent(shownPct)}</span>
			</div>
		</div>
		<div class="dana-score-gauge__copy">
			{#if model}<span class="dana-score-gauge__model-badge">{MODEL_BADGE[model]}</span>{/if}
			<p class="dana-score-gauge__label">{label}</p>
			{#if band}
				<p class="dana-score-gauge__band" class:is-visible={bandVisible} style="background:{accent}">
					{band}
				</p>
			{/if}
		</div>
	</div>
{:else}
	<div
		class="dana-magic-root dana-score-gauge dana-score-gauge--ring dana-score-gauge--solid {modelClass} {compactClass}"
		dir="rtl"
		role="img"
		aria-label="{label}: {faNumber(score)} از {faNumber(max)}"
		data-variant={variant}
		data-model={model || undefined}
	>
		<div
			class="dana-score-gauge__arcbar dana-score-gauge__arcbar--ring"
			role="progressbar"
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={score}
		>
			<svg viewBox="0 0 200 124" class="dana-score-gauge__arc-svg" aria-hidden="true">
				<defs>
					<linearGradient id="{gradId}-ring" x1="0%" y1="0%" x2="100%" y2="0%">
						{#each stops as stop}
							<stop offset="{stop.offset}%" stop-color={stop.color} />
						{/each}
					</linearGradient>
				</defs>
				<path
					d="M20 100 A80 80 0 0 1 180 100"
					fill="none"
					stroke="#ECEFF1"
					stroke-width="16"
					stroke-linecap="round"
				/>
				<path
					d="M20 100 A80 80 0 0 1 180 100"
					fill="none"
					stroke="url(#{gradId}-ring)"
					stroke-width="16"
					stroke-linecap="round"
					stroke-dasharray={ARC_LEN}
					stroke-dashoffset={ARC_LEN - (ARC_LEN * shownPct) / 100}
					class="dana-score-gauge__arc"
				/>
				<circle cx={dotX} cy={dotY} r="8" fill="#ffffff" stroke="#37474F" stroke-width="2.5" />
			</svg>
			<div class="dana-score-gauge__arc-center dana-score-gauge__arc-center--ring">
				<span class="dana-score-gauge__score dana-score-gauge__score--lg tabular-nums"
					>{faNumber(shownScore)}</span
				>
			</div>
		</div>
		<div class="dana-score-gauge__copy">
			{#if model}<span class="dana-score-gauge__model-badge">{MODEL_BADGE[model]}</span>{/if}
			<p class="dana-score-gauge__label">{label}</p>
			{#if band}
				<p class="dana-score-gauge__band" class:is-visible={bandVisible} style="background:{accent}">
					{band}
				</p>
			{/if}
			<p class="dana-score-gauge__range">بازه {faNumber(min)} تا {faNumber(max)}</p>
		</div>
	</div>
{/if}