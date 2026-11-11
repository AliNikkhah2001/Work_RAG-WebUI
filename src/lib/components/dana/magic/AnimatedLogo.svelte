<script lang="ts">
	import { resolveMagicVariant } from '$lib/dana/variants';

	export let params: Record<string, unknown> = {};

	$: label = (params.label as string) || 'شرکت اعتبارسنجی ایران';
	$: variant = resolveMagicVariant('logo', params, 'white');

	const assets: Record<string, { webm: string; still: string }> = {
		white: {
			webm: '/static/dana/brand/motion/web/ICS_white-Logo_Hor.webm',
			still: '/static/dana/brand/motion/web/ICS_white-Logo_Hor-still.png'
		},
		maroon: {
			webm: '/static/dana/brand/motion/web/ICS_Maroon-Logo_Hor.webm',
			still: '/static/dana/brand/motion/web/ICS_Maroon-Logo_Hor-still.png'
		},
		gauge: {
			webm: '/static/dana/brand/motion/web/ICS_Gauge-Color-Logo_Hor.webm',
			still: '/static/dana/brand/motion/web/ICS_Gauge-Color-Logo_Hor-still.png'
		}
	};

	$: asset = assets[variant] || assets.white;
</script>

<div class="dana-magic-root dana-anim-logo dana-anim-logo--{variant}" dir="rtl" data-variant={variant}>
	<video
		class="dana-anim-logo__media"
		autoplay
		muted
		loop
		playsinline
		poster={asset.still}
		aria-label={label}
	>
		<source src={asset.webm} type="video/webm" />
	</video>
	<p class="dana-anim-logo__label">{label}</p>
</div>
