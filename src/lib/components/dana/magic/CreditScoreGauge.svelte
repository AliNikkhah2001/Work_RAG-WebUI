<script lang="ts">
	import { onMount } from 'svelte';
	import { faNumber, faPercent } from '$lib/dana/fa';
	import { resolveMagicVariant } from '$lib/dana/variants';

	export let params: Record<string, unknown> = {};

	$: score = typeof params.score === 'number' ? (params.score as number) : 610;
	$: min = typeof params.min === 'number' ? (params.min as number) : 0;
	$: max = typeof params.max === 'number' ? (params.max as number) : 900;
	$: label = (params.label as string) || 'امتیاز اعتباری';
	$: band = (params.band as string) || '';
	$: pct = Math.max(0, Math.min(100, ((score - min) / Math.max(1, max - min)) * 100));
	$: variant = resolveMagicVariant('gauge', params, 'ring');

	/** Semicircle path length for r=80 from (20,100) to (180,100). */
	const ARC_LEN = 251.327;

	let shownPct = 0;
	let shownScore = 0;
	let reduced = false;

	function scoreColor(p: number): string {
		if (p < 33) return '#E53935';
		if (p < 55) return '#FB8C00';
		if (p < 72) return '#FDD835';
		if (p < 88) return '#43A047';
		return '#26C6DA';
	}

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) {
			shownPct = pct;
			shownScore = score;
			return;
		}
		const start = performance.now();
		const dur = 1200;
		let raf = 0;
		const tick = (t: number) => {
			const p = Math.min(1, (t - start) / dur);
			const ease = 1 - Math.pow(1 - p, 3);
			shownPct = pct * ease;
			shownScore = Math.round(score * ease);
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	$: dotAngle = Math.PI - (Math.PI * shownPct) / 100;
	$: dotX = 100 + 80 * Math.cos(dotAngle);
	$: dotY = 100 - 80 * Math.sin(dotAngle);
	$: accent = scoreColor(pct);
</script>

{#if variant === 'hero'}
	<div
		class="dana-magic-root dana-score-gauge dana-score-gauge--hero dana-score-gauge--solid"
		dir="rtl"
		role="img"
		aria-label="{label}: {faNumber(score)} از {faNumber(max)}"
		data-variant={variant}
	>
		<div class="dana-score-gauge__hero">
			<span class="dana-score-gauge__score dana-score-gauge__score--xl tabular-nums"
				>{faNumber(shownScore)}</span
			>
			<p class="dana-score-gauge__label">{label}</p>
			{#if band}<p class="dana-score-gauge__band" style="background:{accent}">{band}</p>{/if}
			<div class="dana-score-gauge__bar" aria-hidden="true">
				<span style="width:{shownPct}%;background:{accent}"></span>
			</div>
			<p class="dana-score-gauge__range">بازه {faNumber(min)} تا {faNumber(max)}</p>
		</div>
	</div>
{:else if variant === 'arc'}
	<div
		class="dana-magic-root dana-score-gauge dana-score-gauge--arc dana-score-gauge--solid"
		dir="rtl"
		role="img"
		aria-label="{label}: {faNumber(score)}"
		data-variant={variant}
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
					<linearGradient id="dana-arc-grad-{score}" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#E53935" />
						<stop offset="35%" stop-color="#FB8C00" />
						<stop offset="55%" stop-color="#FDD835" />
						<stop offset="80%" stop-color="#43A047" />
						<stop offset="100%" stop-color="#26C6DA" />
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
					stroke="url(#dana-arc-grad-{score})"
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
			<p class="dana-score-gauge__label">{label}</p>
			{#if band}<p class="dana-score-gauge__band" style="background:{accent}">{band}</p>{/if}
		</div>
	</div>
{:else}
	<!-- Gauge B: solid semicircle ring (default "ring") -->
	<div
		class="dana-magic-root dana-score-gauge dana-score-gauge--ring dana-score-gauge--solid"
		dir="rtl"
		role="img"
		aria-label="{label}: {faNumber(score)} از {faNumber(max)}"
		data-variant={variant}
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
					<linearGradient id="dana-ring-grad-{score}" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#E53935" />
						<stop offset="35%" stop-color="#FB8C00" />
						<stop offset="55%" stop-color="#FDD835" />
						<stop offset="80%" stop-color="#43A047" />
						<stop offset="100%" stop-color="#26C6DA" />
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
					stroke="url(#dana-ring-grad-{score})"
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
			<p class="dana-score-gauge__label">{label}</p>
			{#if band}
				<p class="dana-score-gauge__band" style="background:{accent}">{band}</p>
			{/if}
			<p class="dana-score-gauge__range">بازه {faNumber(min)} تا {faNumber(max)}</p>
		</div>
	</div>
{/if}
