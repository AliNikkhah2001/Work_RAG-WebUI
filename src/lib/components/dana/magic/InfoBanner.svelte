<script lang="ts">
	export let params: Record<string, unknown> = {};
	$: title = (params.title as string) || 'اطلاعیه';
	$: body = (params.body as string) || '';
</script>

<div class="dana-magic-root dana-info-banner">
	<strong>{title}</strong>
	{#if body}
		<div class="text-sm leading-6">{body}</div>
	{/if}
</div>
