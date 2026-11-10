<script lang="ts">
	import { danaThemePack } from '$lib/dana/theme';

	$: bg = $danaThemePack?.chat_background ?? null;
	$: poster = bg?.still || bg?.image || bg?.gif || undefined;
</script>

{#if bg?.webm || bg?.gif || bg?.image || bg?.still}
	<div class="dana-chat-bg" aria-hidden="true">
		{#if bg.image || bg.still}
			<img class="dana-chat-bg__media dana-chat-bg__still" src={bg.image || bg.still} alt="" />
		{/if}
		{#if bg.webm}
			<video
				class="dana-chat-bg__media dana-chat-bg__motion"
				autoplay
				muted
				loop
				playsinline
				poster={poster}
			>
				<source src={bg.webm} type="video/webm" />
			</video>
		{:else if bg.gif}
			<img class="dana-chat-bg__media dana-chat-bg__motion" src={bg.gif} alt="" />
		{/if}
		<div class="dana-chat-bg__veil"></div>
	</div>
{/if}
