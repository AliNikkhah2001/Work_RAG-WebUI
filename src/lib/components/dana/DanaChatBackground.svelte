<script lang="ts">
	import { danaThemePack } from '$lib/dana/theme';

	$: bg = $danaThemePack?.chat_background ?? null;
</script>

{#if bg?.webm || bg?.gif}
	<div class="dana-chat-bg" aria-hidden="true">
		{#if bg.webm}
			<video
				class="dana-chat-bg__media"
				autoplay
				muted
				loop
				playsinline
				poster={bg.gif || undefined}
			>
				<source src={bg.webm} type="video/webm" />
			</video>
		{:else if bg.gif}
			<img class="dana-chat-bg__media" src={bg.gif} alt="" />
		{/if}
		<div class="dana-chat-bg__veil"></div>
	</div>
{/if}
