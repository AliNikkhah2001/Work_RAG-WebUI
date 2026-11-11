<script lang="ts">
	import { onMount } from 'svelte';
	import { faNumber, faPercent } from '$lib/dana/fa';
	import { resolveMagicVariant } from '$lib/dana/variants';

	export let params: Record<string, unknown> = {};

	$: score = typeof params.score === 'number' ? (params.score as number) : 720;
	$: min = typeof params.min === 'number' ? (params.min as number) : 0;
	$: max = typeof params.max === 'number' ? (params.max as number) : 900;
	$: label = (params.label as string) || 'امتیاز اعتباری';
	$: band = (params.band as string) || '';
	$: pct = Math.max(0, Math.min(100, ((score - min) / Math.max(1, max - min)) * 100));
	$: variant = resolveMagicVariant('gauge', params, 'ring');

	const size = 148;
	const stroke = 12;
	const r = (size - stroke) / 2;
	const c = 2 * Math.PI * r;

	let shown = 0;
	let reduced = false;

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) {
			shown = pct;
			return;
		}
		const start = performance.now();
		const dur = 1100;
		let raf = 0;
		const tick = (t: number) => {
			const p = Math.min(1, (t - start) / dur);
			const ease = 1 - Math.pow(1 - p, 3);
			shown = pct * ease;
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<div
	class="dana-magic-root dana-score-gauge dana-score-gauge--{variant}"
	dir="rtl"
	role="img"
	aria-label="{label}: {faNumber(score)} از {faNumber(max)}"
	data-variant={variant}
>
	{#if variant === 'hero'}
		<div class="dana-score-gauge__hero">
			<span class="dana-score-gauge__score dana-score-gauge__score--xl tabular-nums"
				>{faNumber(score)}</span
			>
			<p class="dana-score-gauge__label">{label}</p>
			{#if band}<p class="dana-score-gauge__band">{band}</p>{/if}
			<div class="dana-score-gauge__bar" aria-hidden="true">
				<span style="width:{shown}%"></span>
			</div>
			<p class="dana-score-gauge__range">بازه {faNumber(min)} تا {faNumber(max)}</p>
		</div>
	{:else if variant === 'arc'}
		<div class="dana-score-gauge__arcbar" role="progressbar" aria-valuenow={score} aria-valuemin={min} aria-valuemax={max}>
			<svg viewBox="0 0 200 110" class="dana-score-gauge__arc-svg" aria-hidden="true">
				<path
					d="M20 100 A80 80 0 0 1 180 100"
					fill="none"
					stroke="rgba(255,255,255,0.22)"
					stroke-width="12"
					stroke-linecap="round"
				/>
				<path
					d="M20 100 A80 80 0 0 1 180 100"
					fill="none"
					stroke="var(--dana-gauge-yellow, #FFD600)"
					stroke-width="12"
					stroke-linecap="round"
					stroke-dasharray="251"
					stroke-dashoffset={251 - (251 * shown) / 100}
					class="dana-score-gauge__arc"
				/>
			</svg>
			<div class="dana-score-gauge__arc-center">
				<span class="dana-score-gauge__score tabular-nums">{faNumber(score)}</span>
				<span class="dana-score-gauge__meta">{faPercent(shown)}</span>
			</div>
		</div>
		<div class="dana-score-gauge__copy">
			<p class="dana-score-gauge__label">{label}</p>
			{#if band}<p class="dana-score-gauge__band">{band}</p>{/if}
		</div>
	{:else}
		<div
			class="dana-score-gauge__ring"
			role="progressbar"
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={score}
			style="width:{size}px;height:{size}px"
		>
			<svg width={size} height={size} class="dana-score-gauge__svg" aria-hidden="true">
				<circle
					cx={size / 2}
					cy={size / 2}
					r={r}
					fill="none"
					stroke="rgba(255,255,255,0.22)"
					stroke-width={stroke}
				/>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={r}
					fill="none"
					stroke="rgba(255,255,255,0.95)"
					stroke-width={stroke}
					stroke-linecap="round"
					stroke-dasharray={c}
					stroke-dashoffset={c - (c * shown) / 100}
					class="dana-score-gauge__arc"
				/>
			</svg>
			<div class="dana-score-gauge__center">
				<span class="dana-score-gauge__score tabular-nums">{faNumber(score)}</span>
				<span class="dana-score-gauge__meta">{faPercent(shown)}</span>
			</div>
		</div>
		<div class="dana-score-gauge__copy">
			<p class="dana-score-gauge__label">{label}</p>
			{#if band}
				<p class="dana-score-gauge__band">{band}</p>
			{/if}
			<p class="dana-score-gauge__range">
				بازه {faNumber(min)} تا {faNumber(max)}
			</p>
		</div>
	{/if}
</div>
