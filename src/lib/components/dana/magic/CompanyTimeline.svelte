<script lang="ts">
	import { onMount } from 'svelte';
	import { faDigits } from '$lib/dana/fa';
	import { resolveMagicVariant } from '$lib/dana/variants';

	type Item = {
		date?: string;
		title: string;
		description?: string;
		side?: 'start' | 'end' | 'left' | 'right';
	};

	export let params: Record<string, unknown> = {};

	const FALLBACK: Item[] = [
		{
			date: '۱۳۸۵',
			title: 'تأسیس شرکت',
			description: 'شروع فرایند اعتبار سنجی در ایران و تاسیس شرکت اعتبار سنجی ایران'
		},
		{
			date: '۱۳۸۸',
			title: 'الزام بانک‌ها',
			description:
				'آغاز فرآیند اعتبار سنجی تسهیلات گیرندگان صدور بخشنامه بانک مرکزی و الزام بانک‌ها به استفاده از گزارشات شرکت'
		},
		{
			date: '۱۳۸۹',
			title: 'آیین‌نامه سنجش اعتبار',
			description: 'تصویب آیین نامه نظام سنجش اعتبار'
		},
		{
			date: '۱۳۹۴',
			title: 'اولین مدل امتیاز',
			description:
				'ارائه اولین مدل امتیاز اعتباری در کشور عقد قرارداد با نمایندگان فروش جهت توسعه بازار اعتبارسنجی'
		},
		{
			date: '۱۳۹۸',
			title: 'بومی‌سازی سامانه',
			description: 'شروع پروژه بومی سازی سامانه اعتبار سنجی'
		},
		{
			date: '۱۴۰۰',
			title: 'کالیبراسیون و BNPL',
			description:
				'کالیبراسیون و به روزرسانی مدل امتیاز اعتباری راه اندازی سامانه رسیدگی به اعتراضات و واحد ارتباط با مشتریان شروع همکاری با شرکت‌های ارائه دهنده BNPL'
		},
		{
			date: '۱۴۰۲',
			title: 'مدل‌های ویژه بانک‌ها',
			description:
				'شروع همکاری با بانک‌ها جهت ساخت مدل امتیاز اعتباری ویژه بانک‌های صادرات، رفاه، تجارت و مهر'
		},
		{
			date: '۱۴۰۳',
			title: 'مدل هوش مصنوعی',
			description: 'راه اندازی مدل جدید مبتنی بر هوش مصنوعی با جامعیت و کارایی بالاتر'
		}
	];

	$: title = (params.title as string) || 'تاریخچه شرکت اعتبارسنجی ایران';
	$: rawItems = (Array.isArray(params.items) && (params.items as Item[]).length
		? (params.items as Item[])
		: FALLBACK) as Item[];
	$: items = rawItems;
	$: activeIndex =
		typeof params.activeIndex === 'number' ? (params.activeIndex as number) : items.length - 1;
	$: variant = resolveMagicVariant('timeline', params, 'vertical');

	let visible = 0;
	let linePct = 0;
	let rootEl: HTMLElement | null = null;

	const toFaDate = (d?: string) => (d ? faDigits(d) : '');

	function sideOf(item: Item, i: number): 'start' | 'end' {
		if (item.side === 'end' || item.side === 'left') return 'end';
		if (item.side === 'start' || item.side === 'right') return 'start';
		return i % 2 === 0 ? 'start' : 'end';
	}

	onMount(() => {
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) {
			visible = items.length;
			linePct = 100;
			return;
		}

		const reveal = () => {
			const start = performance.now();
			const dur = Math.min(2200, 400 + items.length * 220);
			let raf = 0;
			const tick = (t: number) => {
				const p = Math.min(1, (t - start) / dur);
				const ease = 1 - Math.pow(1 - p, 3);
				linePct = 100 * ease;
				visible = Math.min(items.length, Math.ceil(items.length * ease));
				if (p < 1) raf = requestAnimationFrame(tick);
				else {
					visible = items.length;
					linePct = 100;
				}
			};
			raf = requestAnimationFrame(tick);
			return () => cancelAnimationFrame(raf);
		};

		if (!('IntersectionObserver' in window) || !rootEl) {
			return reveal();
		}

		let stop: (() => void) | undefined;
		const io = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					stop = reveal();
					io.disconnect();
				}
			},
			{ threshold: 0.2 }
		);
		io.observe(rootEl);
		return () => {
			io.disconnect();
			stop?.();
		};
	});
</script>

<div
	bind:this={rootEl}
	class="dana-magic-root dana-timeline dana-timeline--{variant} dana-timeline--solid"
	dir="rtl"
	data-variant={variant}
>
	{#if title}
		<h3 class="dana-timeline__title">{title}</h3>
	{/if}
	{#if items.length}
		{#if variant === 'horizontal'}
			<ol class="dana-timeline__rail">
				{#each items as item, i}
					<li
						class="dana-timeline__rail-item"
						class:is-active={i === activeIndex}
						class:is-on={i < visible}
						style={`--i:${i}`}
					>
						<span class="dana-timeline__dot" aria-hidden="true"></span>
						<p class="dana-timeline__item-title">{item.title}</p>
						{#if item.date}<p class="dana-timeline__date">{toFaDate(item.date)}</p>{/if}
					</li>
				{/each}
			</ol>
		{:else if variant === 'compact'}
			<ol class="dana-timeline__compact">
				{#each items as item, i}
					<li class:is-active={i === activeIndex} class:is-on={i < visible} style={`--i:${i}`}>
						<span class="dana-timeline__compact-date">{toFaDate(item.date || '')}</span>
						<span class="dana-timeline__compact-title">{item.title}</span>
					</li>
				{/each}
			</ol>
		{:else}
			<div class="dana-timeline__spine" style={`--line:${linePct}%`} aria-hidden="true"></div>
			<ol class="dana-timeline__zigzag">
				{#each items as item, i}
					{@const side = sideOf(item, i)}
					<li
						class="dana-timeline__zitem dana-timeline__zitem--{side}"
						class:is-active={i === activeIndex}
						class:is-on={i < visible}
						style={`--i:${i}`}
					>
						<span class="dana-timeline__year">{toFaDate(item.date || '')}</span>
						<div class="dana-timeline__card">
							<p class="dana-timeline__item-title">{item.title}</p>
							{#if item.description}
								<p class="dana-timeline__desc">{item.description}</p>
							{/if}
						</div>
					</li>
				{/each}
			</ol>
		{/if}
	{:else}
		<p class="dana-timeline__empty">رویدادی برای نمایش نیست.</p>
	{/if}
</div>
