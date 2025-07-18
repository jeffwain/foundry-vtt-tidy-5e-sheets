<script lang="ts">
  import type { ColumnCellProps } from 'src/runtime/types';
  import Dnd5eIcon from 'src/components/icon/Dnd5eIcon.svelte';
  import { Actions } from 'src/features/actions/actions.svelte';
  import { error } from 'src/utils/logging';
  import ListItemsTooltip from 'src/tooltips/ListItemsTooltip.svelte';

  let { rowDocument, rowContext }: ColumnCellProps = $props();

  const damageHealingTypeIcons = Actions.damageAndHealingTypesIconSrcMap;

  function getTrimmedExpression(formula: string) {
    try {
      return new Roll(formula).terms.map((t: any) => t.expression).join(' ');
    } catch (e) {
      error(
        'An error occurred while preparing a damage formula for the formula column',
        false,
        { error: e, rowDocument, rowContext },
      );
    }
    return formula;
  }

  let tooltip = $state<ListItemsTooltip>();
  let labels = $derived(rowDocument.labels.damages?.map((d: any) => d.label) ?? []);
</script>

<ListItemsTooltip
  bind:this={tooltip}
  entries={labels}
  sheetDocument={rowDocument.actor}
/>

<div
  class="flexcol truncate"
  onmouseover={(ev) => labels?.length && tooltip?.tryShow(ev.currentTarget)}
>
  {#each rowDocument.labels.damages ?? [] as damage}
    {@const formula = getTrimmedExpression(damage.formula)}
    {@const damageHealingIcon = damageHealingTypeIcons[damage.damageType]}
    <div class="flexrow damage-formula-container">
      <span class="flexshrink damage-formula truncate">{formula}</span>
      {#if damageHealingIcon}
        <span class="flexshrink damage-icon" aria-label={damage.label}>
          <Dnd5eIcon src={damageHealingIcon} />
        </span>
      {/if}
    </div>
  {:else}
    <span class="color-text-disabled">&mdash;</span>
  {/each}
</div>
