<script lang="ts">
	import { getContext, onDestroy, onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';
	import { cubicInOut, cubicOut } from 'svelte/easing';

	import {
		chatId,
		config,
		mobile,
		selectedFolder,
		showSearch,
		showSidebar,
		temporaryChatEnabled,
		user
	} from '$lib/stores';
	import { chats, loadNextChatListPage, refreshChatList } from '$lib/stores/chatList';
	import { danaThemePack } from '$lib/dana/theme';
	import { WEBUI_API_BASE_URL } from '$lib/constants';

	import SearchModal from '$lib/components/layout/SearchModal.svelte';
	import UserMenu from '$lib/components/layout/Sidebar/UserMenu.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import DanaIcon from './DanaIcon.svelte';

	const i18n: any = getContext('i18n');

	let loadingMore = false;
	let listDone = false;
	const onDestroyCallbacks: Array<() => void> = [];
	onDestroy(() => onDestroyCallbacks.forEach((fn) => fn()));

	$: copy = $danaThemePack?.copy ?? {};
	$: sidebarLogo =
		$danaThemePack?.redesign?.sidebar_logo ?? $danaThemePack?.redesign?.footer_logo;

	// Off until the initial open/closed state is applied, so page load doesn't animate.
	let animate = false;
	const reducedMotion = () =>
		typeof window !== 'undefined' &&
		window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
	const ms = (d: number) => (animate && !reducedMotion() ? d : 0);

	// Desktop: collapse the shell's width so the main column reflows smoothly while the
	// fixed-width panel inside slides out under the clip.
	const collapse = (node: HTMLElement, { duration = 280 } = {}) => {
		const w = node.offsetWidth;
		return {
			duration,
			easing: cubicInOut,
			css: (t: number) => `width:${t * w}px;flex-basis:${t * w}px;opacity:${Math.min(1, t * 1.6)}`
		};
	};

	const closeOnMobile = () => {
		if ($mobile) showSidebar.set(false);
	};

	const newChat = async () => {
		selectedFolder.set(null);
		const enforced = $user?.role !== 'admin' && $user?.permissions?.chat?.temporary_enforced;
		await temporaryChatEnabled.set(!!enforced);
		await goto('/');
		await tick();
		// Navbar exposes initNewChat through this hidden button; resets the chat when already on "/".
		document.getElementById('new-chat-button')?.click();
		closeOnMobile();
	};

	const onListScroll = async (e: Event) => {
		const el = e.currentTarget as HTMLElement;
		if (loadingMore || listDone) return;
		if (el.scrollTop + el.clientHeight < el.scrollHeight - 80) return;
		loadingMore = true;
		try {
			const res = await loadNextChatListPage(localStorage.token);
			listDone = res.allLoaded;
		} finally {
			loadingMore = false;
		}
	};

	onMount(async () => {
		// Same storage key as the stock sidebar; the redesign defaults to open on desktop.
		let stored: string | null = null;
		try {
			stored = localStorage.getItem('sidebar');
		} catch {
			/* storage blocked */
		}
		if ($chats === null) {
			const res = await refreshChatList(localStorage.token, { refreshPinned: true });
			listDone = res.allLoaded;
		}
		// No history yet: start closed, without overwriting the saved preference.
		const hasHistory = ($chats ?? []).length > 0;
		showSidebar.set(!$mobile && hasHistory && stored !== 'false');

		let ready = false;
		const unsubscribers = [
			showSidebar.subscribe((value) => {
				if (!ready) return;
				try {
					localStorage.setItem('sidebar', String(value));
				} catch {
					/* storage blocked */
				}
			}),
			mobile.subscribe((value) => {
				if (value && $showSidebar) showSidebar.set(false);
			})
		];
		onDestroyCallbacks.push(...unsubscribers);
		ready = true;
		await tick();
		animate = true;
	});
</script>

<SearchModal
	bind:show={$showSearch}
	variant="dana"
	kind="chat"
	placeholder={copy.search_placeholder ?? ''}
	heading={copy.search_heading ?? ''}
	onClose={() => {
		closeOnMobile();
	}}
/>

<!-- Keyboard shortcut (NEW_CHAT) clicks this id, same as the stock sidebar. -->
<button id="sidebar-new-chat-button" class="hidden" on:click={newChat} aria-hidden="true" tabindex="-1"
></button>

{#if $showSidebar}
	{#if $mobile}
		<button
			class="dana-sidebar-backdrop"
			aria-label={$i18n.t('Close Sidebar')}
			on:click={() => showSidebar.set(false)}
			transition:fade|global={{ duration: ms(200) }}
		></button>
	{/if}

	<div
		class="dana-sidebar-shell"
		class:is-mobile={$mobile}
		in:collapse={{ duration: $mobile ? 0 : ms(280) }}
		out:collapse={{ duration: $mobile ? 0 : ms(240) }}
	>
	<aside
		id="dana-sidebar"
		class="dana-sidebar"
		class:is-mobile={$mobile}
		aria-label={$i18n.t('Chat history')}
		in:fly={{ x: -300, duration: $mobile ? ms(280) : 0, easing: cubicOut, opacity: 1 }}
		out:fly={{ x: -300, duration: $mobile ? ms(220) : 0, easing: cubicInOut, opacity: 1 }}
	>
		<div class="dana-sidebar__top">
			<div class="dana-sidebar__tools">
				<Tooltip content={$i18n.t('Close Sidebar')} placement="bottom">
					<button
						class="dana-icon-btn"
						aria-label={$i18n.t('Close Sidebar')}
						on:click={() => showSidebar.set(false)}
					>
						<DanaIcon name="sidebar" className="size-6" />
					</button>
				</Tooltip>
				<Tooltip content={$i18n.t('Search')} placement="bottom">
					<button
						class="dana-icon-btn"
						aria-label={$i18n.t('Search')}
						on:click={() => showSearch.set(true)}
					>
						<DanaIcon name="search" className="size-6" />
					</button>
				</Tooltip>
			</div>
			<!-- No account menu when auth is disabled (everyone is the shared default user). -->
			{#if $user && $config?.features?.auth !== false}
				<UserMenu role={$user?.role} profile={$config?.features?.enable_user_status ?? true}>
					<button type="button" class="dana-sidebar__avatar" aria-label={$i18n.t('User menu')}>
						<img
							src={`${WEBUI_API_BASE_URL}/users/${$user?.id}/profile/image`}
							alt={$i18n.t('Open User Profile Menu')}
						/>
					</button>
				</UserMenu>
			{/if}
		</div>

		<button class="dana-sidebar__new" on:click={newChat}>
			<DanaIcon name="edit" className="size-6" />
			<span>{copy.new_chat ?? $i18n.t('New Chat')}</span>
		</button>

		<div class="dana-sidebar__heading">{copy.history_heading ?? $i18n.t('Chats')}</div>

		<nav class="dana-sidebar__list" on:scroll={onListScroll}>
			{#each $chats ?? [] as chat (chat.id)}
				<a
					href="/c/{chat.id}"
					class="dana-sidebar__item"
					class:is-active={$chatId === chat.id}
					aria-current={$chatId === chat.id ? 'page' : undefined}
					title={String(chat.title ?? '')}
					on:click={closeOnMobile}
				>
					<span class="dana-sidebar__item-title">{chat.title || $i18n.t('New Chat')}</span>
				</a>
			{/each}
			{#if Array.isArray($chats) && $chats.length === 0}
				<div class="dana-sidebar__empty">
					{copy.history_empty ?? $i18n.t('No chats yet')}
				</div>
			{/if}
			{#if loadingMore}
				<div class="dana-sidebar__more">…</div>
			{/if}
		</nav>

		<div class="dana-sidebar__foot">
			{#if sidebarLogo}
				<img class="dana-sidebar__logo" src={sidebarLogo} alt={copy.subtitle ?? ''} />
			{/if}
		</div>
	</aside>
	</div>
{:else}
	<div
		class="dana-sidebar-rail"
		in:fade={{ duration: ms(160), delay: ms(140) }}
		out:fade={{ duration: ms(80) }}
	>
		<Tooltip content={$i18n.t('Open Sidebar')} placement="bottom">
			<button
				id="sidebar-open-button"
				class="dana-icon-btn"
				aria-label={$i18n.t('Open Sidebar')}
				on:click={() => showSidebar.set(true)}
			>
				<DanaIcon name="sidebar" className="size-6" />
			</button>
		</Tooltip>
	</div>
{/if}
