<script lang="ts">
	import { faDigits } from '$lib/dana/fa';
	import { resolveMagicVariant } from '$lib/dana/variants';

	export let params: Record<string, unknown> = {};

	$: title = (params.title as string) || 'جدول';
	$: columns = (Array.isArray(params.columns) ? params.columns : []) as string[];
	$: rows = (Array.isArray(params.rows) ? params.rows : []) as (string | number)[][];
	$: variant = resolveMagicVariant('table', params, 'striped');
	$: cell = (v: string | number) => (typeof v === 'number' ? faDigits(String(v)) : faDigits(String(v)));
</script>

<div class="dana-magic-root dana-table dana-table--{variant}" dir="rtl" data-variant={variant}>
	{#if title}
		<h3 class="dana-table__title">{title}</h3>
	{/if}

	{#if variant === 'cards'}
		<div class="dana-table__cards">
			{#each rows as row, i}
				<article class="dana-table__card">
					{#each columns as col, ci}
						<div class="dana-table__card-row">
							<span class="dana-table__card-key">{col}</span>
							<span class="dana-table__card-val">{cell(row[ci] ?? '')}</span>
						</div>
					{/each}
				</article>
			{/each}
		</div>
	{:else}
		<div class="dana-table__scroll">
			<table class="dana-table__grid">
				<thead>
					<tr>
						{#each columns as col}
							<th>{col}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each rows as row}
						<tr>
							{#each columns as _, ci}
								<td>{cell(row[ci] ?? '')}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
