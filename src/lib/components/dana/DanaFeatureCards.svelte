<script lang="ts">
	import { fade } from 'svelte/transition';
	import { danaThemePack } from '$lib/dana/theme';
	import DanaIcon from './DanaIcon.svelte';

	export let onSelect: (e: { type: string; data: string }) => void = () => {};

	$: cards = $danaThemePack?.redesign?.feature_cards ?? [];
	$: footerLogo = $danaThemePack?.redesign?.footer_logo;
	$: footerAlt = $danaThemePack?.copy?.subtitle ?? '';
</script>

{#if cards.length}
	<div class="dana-cards" dir="rtl" in:fade={{ duration: 200, delay: 150 }}>
		{#each cards as card, i (i)}
			<button
				type="button"
				class="dana-card"
				style="--i:{i}"
				on:click={() => onSelect({ type: 'prompt', data: card.prompt || card.title })}
			>
				<span class="dana-card__icon" aria-hidden="true">
					<DanaIcon
						name={card.icon === 'chat' ? 'card-chat' : 'card-sparkles'}
						className="size-full"
					/>
				</span>
				<span class="dana-card__title">{card.title}</span>
				{#if card.body}
					<span class="dana-card__body">{card.body}</span>
				{/if}
			</button>
		{/each}
	</div>
{/if}

{#if footerLogo}
	<div class="dana-home__footer">
		<img src={footerLogo} alt={footerAlt} draggable="false" />
	</div>
{/if}
