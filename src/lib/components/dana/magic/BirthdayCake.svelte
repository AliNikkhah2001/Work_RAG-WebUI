<script lang="ts">
	export let params: Record<string, unknown> = {};
	$: message = (params.message as string) || 'تولدت مبارک!';
</script>

<div class="dana-magic-root dana-birthday" role="img" aria-label={message}>
	<div class="dana-birthday-cake">🎂</div>
	<div class="text-sm font-semibold text-[color:var(--dana-primary-shade,#6D0035)]">{message}</div>
</div>
