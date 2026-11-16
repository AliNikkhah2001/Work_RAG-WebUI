<script lang="ts">
	import { onMount } from 'svelte';
	import { faNumber } from '$lib/dana/fa';

	type Holder = {
		id?: string;
		name: string;
		percent: number;
		logo?: string;
		color?: string;
	};

	export let params: Record<string, unknown> = {};

	const FALLBACK: Holder[] = [];

	let catalogItems: Holder[] = FALLBACK;
	let loaded = false;
	let active = 0;
	let shownPct = 0;
	let reduced = false;
	let timer: ReturnType<typeof setInterval> | null = null;

	$: title = (params.title as string) || 'سهامداران شرکت اعتبارسنجی ایران';
	$: paramItems = (Array.isArray(params.items) ? params.items : []) as Holder[];
	$: items = paramItems.length ? paramItems : catalogItems;
	$: total = items.reduce((s, h) => s + (Number(h.percent) || 0), 0) || 100;
	$: activeItem = items[active] || null;
	$: autoplay = params.autoplay !== false;

	const ACCENT = '#C48A9A';
	const MUTED = '#D9D9D9';

	function donutSlices(list: Holder[]): { d: string; color: string; i: number }[] {
		const r = 42;
		const cx = 50;
		const cy = 50;
		let angle = -Math.PI / 2;
		const slices: { d: string; color: string; i: number }[] = [];
		list.forEach((h, i) => {
			const sweep = ((Number(h.percent) || 0) / total) * Math.PI * 2;
			const a0 = angle;
			const a1 = angle + Math.max(sweep, 0.01);
			const x0 = cx + r * Math.cos(a0);
			const y0 = cy + r * Math.sin(a0);
			const x1 = cx + r * Math.cos(a1);
			const y1 = cy + r * Math.sin(a1);
			const large = sweep > Math.PI ? 1 : 0;
			const d = `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
			slices.push({
				d,
				color: i === active ? (h.color || ACCENT) : MUTED,
				i
			});
			angle = a1;
		});
		return slices;
	}

	$: slices = donutSlices(items);

	function select(i: number) {
		active = i;
		animatePct();
	}

	function animatePct() {
		const target = Number(activeItem?.percent) || 0;
		if (reduced) {
			shownPct = target;
			return;
		}
		const from = 0;
		const start = performance.now();
		const dur = 700;
		const tick = (t: number) => {
			const p = Math.min(1, (t - start) / dur);
			const ease = 1 - Math.pow(1 - p, 3);
			shownPct = from + (target - from) * ease;
			if (p < 1) requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	}

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let cancelled = false;

		(async () => {
			if (paramItems.length) {
				loaded = true;
				animatePct();
				return;
			}
			try {
				const res = await fetch('/static/dana/magic-data/shareholders.json', { cache: 'force-cache' });
				if (res.ok) {
					const data = await res.json();
					if (!cancelled && Array.isArray(data.items)) catalogItems = data.items as Holder[];
				}
			} catch {
				/* keep empty */
			} finally {
				if (!cancelled) {
					loaded = true;
					animatePct();
				}
			}
		})();

		if (autoplay && !reduced) {
			timer = setInterval(() => {
				if (!items.length) return;
				active = (active + 1) % items.length;
				animatePct();
			}, 3200);
		}

		return () => {
			cancelled = true;
			if (timer) clearInterval(timer);
		};
	});

</script>

<div class="dana-magic-root dana-holders dana-holders--solid" dir="rtl" data-variant="ring">
	{#if title}
		<h3 class="dana-holders__title">{title}</h3>
	{/if}

	{#if !items.length && loaded}
		<p class="dana-holders__empty">سهامداری برای نمایش نیست.</p>
	{:else if items.length}
		<div class="dana-holders__row">
			<div class="dana-holders__chart" role="img" aria-label={activeItem?.name || title}>
				<svg viewBox="0 0 100 100" class="dana-holders__svg" aria-hidden="true">
					{#each slices as s}
						<path
							d={s.d}
							fill="none"
							stroke={s.color}
							stroke-width="14"
							stroke-linecap="butt"
							class="dana-holders__seg"
							class:is-active={s.i === active}
							role="presentation"
							on:click={() => select(s.i)}
						/>
					{/each}
				</svg>
				<div class="dana-holders__logo-wrap">
					{#if activeItem?.logo}
						<img class="dana-holders__logo" src={activeItem.logo} alt={activeItem.name} />
					{/if}
				</div>
			</div>

			<button
				type="button"
				class="dana-holders__card"
				on:click={() => select((active + 1) % items.length)}
				aria-label={activeItem?.name}
			>
				<span class="dana-holders__name">{activeItem?.name || '—'}</span>
				<span class="dana-holders__pct tabular-nums"
					>{faNumber(Math.round(shownPct * 10) / 10)} %</span
				>
			</button>
		</div>

		<div class="dana-holders__dots" role="tablist" aria-label="سهامداران">
			{#each items as h, i}
				<button
					type="button"
					class="dana-holders__dot"
					class:is-active={i === active}
					aria-label={h.name}
					aria-pressed={i === active}
					on:click={() => select(i)}
				></button>
			{/each}
		</div>
	{:else}
		<p class="dana-holders__empty">در حال بارگذاری…</p>
	{/if}
</div>
