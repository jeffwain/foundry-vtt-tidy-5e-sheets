<script lang="ts">
  import type { ColumnCellProps } from 'src/runtime/item/item.types';
  import ItemPriceSummary from '../parts/header/ItemPriceSummary.svelte';

  let { rowDocument }: ColumnCellProps = $props();
</script>

<ItemPriceSummary
  item={rowDocument}
  icon={false}
  truncate={true}
  showTitle={true}
/>
