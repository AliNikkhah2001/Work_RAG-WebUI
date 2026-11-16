<script lang="ts">
	import { commentSurface, contentHash } from '$lib/components/comments/anchors';
	import { getContext } from 'svelte';
	import Collapsible from '$lib/components/common/Collapsible.svelte';
	import Image from '$lib/components/common/Image.svelte';
	import ToolCallDisplay from '$lib/components/common/ToolCallDisplay.svelte';
	import ToolOutputFile from './ToolOutputFile.svelte';
	import { resolveChatMessageToolCall } from '$lib/apis/chats';
	import { settings } from '$lib/stores';
	import { toast } from 'svelte-sonner';

	import Markdown from './Markdown.svelte';
	import ConsecutiveDetailsGroup from './Markdown/ConsecutiveDetailsGroup.svelte';
	import ContextCompactionLabel from './ContextCompactionLabel.svelte';
	import MagicRenderer from '$lib/components/dana/magic/MagicRenderer.svelte';
	import {
		getMagicDefs,
		loadMagicCatalog,
		mergeMagicSegments,
		parseMagicSegments,
		segmentsFromMagicPayload
	} from '$lib/dana/magic';
	import type { MagicSegment, MagicTokenDef } from '$lib/dana/types';
	import {
		buildOutputDisplayItems,
		type OutputDetailToken,
		type OutputDisplayItem,
		type OutputItem
	} from './structuredOutput';

	export let id = '';
	export let chatId = '';
	export let messageId = '';
	export let output: OutputItem[] = [];
	/** Post-hoc Dana magic from ``rag.magic`` (outside message body). */
	export let magic: Array<{ name?: string; params?: Record<string, unknown> }> = [];
	export let done = true;
	export let model = null;
	export let save = false;
	export let preview = false;
	export let commentToolbarId: string | undefined = undefined;
	export let compactPreview = false;
	export let renderMarkdown = true;
	export let editCodeBlock = true;
	export let topPadding = false;
	export let allowEmbeds = false;
	export let allowToolApproval: boolean = false;
	export let sourceIds: string[] = [];
	export let formatMessageContent: (content: string) => string = (content) => content;
	export let onSave: any = () => {};
	export let onSourceClick: any = () => {};
	export let onTaskClick: any = () => {};
	export let onUpdate: any = () => {};
	export let onPreview: any = () => {};
	export let onToolCallResolved: any = () => {};
	export let onSetInputText: (text: string) => void = () => {};

	const i18n = getContext<typeof import('$lib/i18n').default>('i18n');
	const getDetailTitle = (detailToken: OutputDetailToken): any => detailToken.summary;
	const getDetailAttributes = (detailToken: OutputDetailToken): any => detailToken.attributes;
	let resolvingCallId = '';

	/** Remote catalog overlays builtins; builtins alone are enough to compile widgets. */
	let remoteCatalog: Record<string, MagicTokenDef> = {};
	$: magicDefs = getMagicDefs(remoteCatalog);
	$: displayItems = buildOutputDisplayItems(output) as OutputDisplayItem[];

	/** Sync parse — do not wait on fetch or MAGIC tokens stay visible as raw text. */
	$: magicByItem = (() => {
		/** @type {Record<string, MagicSegment[]>} */
		const next: Record<string, MagicSegment[]> = {};
		const payloadSegs = segmentsFromMagicPayload(magic, magicDefs);
		let payloadAttached = false;
		for (const item of displayItems) {
			if (item.type !== 'message' || !item.text) continue;
			const fromBody = parseMagicSegments(formatMessageContent(item.text), magicDefs);
			if (!payloadAttached && payloadSegs.length) {
				next[item.id] = mergeMagicSegments(fromBody, payloadSegs);
				payloadAttached = true;
			} else {
				next[item.id] = fromBody;
			}
		}
		return next;
	})();

	$: if (typeof window !== 'undefined') {
		loadMagicCatalog()
			.then((defs) => {
				remoteCatalog = defs;
			})
			.catch(() => {});
	}

	const resolveToolCall = async (callId: string, approved: boolean) => {
		if (!chatId || !messageId || !callId || resolvingCallId) {
			return;
		}

		resolvingCallId = callId;
		try {
			const res = await resolveChatMessageToolCall(
				localStorage.token,
				chatId,
				messageId,
				callId,
				approved ? 'approve' : 'reject'
			);
			onToolCallResolved(res);
		} catch (err) {
			toast.error(String(err));
		} finally {
			resolvingCallId = '';
		}
	};

	$: detailButtonClassName = `py-0.5 ${
		compactPreview ? 'text-xs' : 'text-[0.90625rem]'
	} text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition`;
</script>

{#each displayItems as displayItem (displayItem.id)}
	{#if displayItem.type === 'message'}
		{#if renderMarkdown}
			<div
				class="markdown-prose"
				use:commentSurface={{
					resource_type: 'chat',
					resource_id: chatId,
					target_type: 'chat_message',
					target_id: messageId,
					surface_id: displayItem.id,
					content_hash: contentHash(displayItem.text),
					enabled: done && !compactPreview && !!chatId,
					toolbar_id: commentToolbarId
				}}
			>
				{#each (magicByItem[displayItem.id]?.length
					? magicByItem[displayItem.id]
					: [{ type: 'text', value: formatMessageContent(displayItem.text) }]) as segment, sIdx}
					{#if segment.type === 'magic'}
						<MagicRenderer
							renderer={segment.renderer}
							params={segment.params}
							onSelect={onSetInputText}
						/>
					{:else if segment.value}
						<Markdown
							id={`${id}-${displayItem.id}-m${sIdx}`}
							{chatId}
							{messageId}
							content={segment.value}
							{model}
							{save}
							{preview}
							{compactPreview}
							{done}
							{allowEmbeds}
							{editCodeBlock}
							{topPadding}
							{sourceIds}
							{onSourceClick}
							{onTaskClick}
							{onToolCallResolved}
							{onSave}
							{onUpdate}
							{onPreview}
						/>
					{/if}
				{/each}
			</div>
		{:else}
			<div
				class="whitespace-pre-wrap text-[0.90625rem]"
				use:commentSurface={{
					resource_type: 'chat',
					resource_id: chatId,
					target_type: 'chat_message',
					target_id: messageId,
					surface_id: displayItem.id,
					content_hash: contentHash(displayItem.text),
					enabled: done && !compactPreview && !!chatId,
					toolbar_id: commentToolbarId
				}}
			>
				{displayItem.text}
			</div>
		{/if}
	{:else if displayItem.type === 'image'}
		<Image src={displayItem.src} alt={$i18n.t('Generated Image')} />
	{:else if displayItem.type === 'detail_group'}
		<ConsecutiveDetailsGroup
			id={`${id}-${displayItem.id}`}
			tokens={displayItem.tokens}
			messageDone={done}
			{compactPreview}
			{allowEmbeds}
			resolvable={!!chatId && !!messageId && (save || allowToolApproval)}
			{resolvingCallId}
			onResolve={resolveToolCall}
		>
			<div slot="content">
				{#each displayItem.tokens as detailToken, detailIndex}
					{#if detailToken.attributes?.type === 'tool_calls'}
						<ToolCallDisplay
							id={`${id}-${displayItem.id}-${detailIndex}-tool-call`}
							attributes={detailToken.attributes}
							resultContent={detailToken.text}
							grouped={true}
							resolvable={!!chatId && !!messageId && (save || allowToolApproval)}
							resolving={resolvingCallId === detailToken.attributes?.id}
							onResolve={(approved) => resolveToolCall(detailToken.attributes?.id ?? '', approved)}
							open={$settings?.expandDetails ?? false}
							className="w-full"
							buttonClassName={detailButtonClassName}
						/>
					{:else if detailToken.text?.length > 0}
						<Collapsible
							title={getDetailTitle(detailToken)}
							open={$settings?.expandDetails ?? false}
							attributes={getDetailAttributes(detailToken)}
							messageDone={done}
							className="w-full"
							buttonClassName={detailButtonClassName}
						>
							<div class="mb-1.5" slot="content">
								<div class="markdown-prose">
									<Markdown
										id={`${id}-${displayItem.id}-${detailIndex}-detail`}
										{chatId}
										{messageId}
										content={detailToken.text}
										{done}
										{allowEmbeds}
										{save}
										{preview}
										{compactPreview}
										{editCodeBlock}
										{onToolCallResolved}
									/>
								</div>
							</div>
						</Collapsible>
					{:else}
						<Collapsible
							title={getDetailTitle(detailToken)}
							open={false}
							disabled={true}
							attributes={getDetailAttributes(detailToken)}
							messageDone={done}
							className="w-full"
							buttonClassName={detailButtonClassName}
						/>
					{/if}
				{/each}
			</div>
		</ConsecutiveDetailsGroup>
	{:else if displayItem.type === 'file'}
		{#if displayItem.item?.displayed || $settings?.terminalFileDisplay === 'inline'}
			<ToolOutputFile item={displayItem.item} {chatId} />
		{/if}
	{:else if displayItem.type === 'context_compaction'}
		<ContextCompactionLabel summary={displayItem.summary} {compactPreview} />
	{:else}
		{@const detailToken = displayItem.token}
		{#if detailToken.attributes?.type === 'tool_calls'}
			<ToolCallDisplay
				id={`${id}-${displayItem.id}-tool-call`}
				attributes={detailToken.attributes}
				resultContent={detailToken.text}
				{allowEmbeds}
				resolvable={!!chatId && !!messageId && (save || allowToolApproval)}
				resolving={resolvingCallId === detailToken.attributes?.id}
				onResolve={(approved) => resolveToolCall(detailToken.attributes?.id ?? '', approved)}
				open={$settings?.expandDetails ?? false}
				className="w-full space-y-2"
				buttonClassName={detailButtonClassName}
			/>
		{:else if detailToken.text?.length > 0}
			<Collapsible
				title={getDetailTitle(detailToken)}
				open={$settings?.expandDetails ?? false}
				attributes={getDetailAttributes(detailToken)}
				messageDone={done}
				className="w-full space-y-2"
				buttonClassName={detailButtonClassName}
			>
				<div class="mb-1.5" slot="content">
					<div class="markdown-prose">
						<Markdown
							id={`${id}-${displayItem.id}-detail`}
							{chatId}
							{messageId}
							content={detailToken.text}
							{done}
							{allowEmbeds}
							{save}
							{preview}
							{compactPreview}
							{editCodeBlock}
							{onToolCallResolved}
						/>
					</div>
				</div>
			</Collapsible>
		{:else}
			<Collapsible
				title={getDetailTitle(detailToken)}
				open={false}
				disabled={true}
				attributes={getDetailAttributes(detailToken)}
				messageDone={done}
				className="w-full space-y-2"
				buttonClassName={detailButtonClassName}
			/>
		{/if}
	{/if}
{/each}
