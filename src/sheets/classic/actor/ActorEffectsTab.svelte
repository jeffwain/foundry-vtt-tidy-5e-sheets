<script lang="ts">
  import { FoundryAdapter } from 'src/foundry/foundry-adapter';
  import {
    type ActorSheetContextV1,
    type RenderableClassicControl,
  } from 'src/types/types';
  import ItemTable from '../../../components/item-list/v1/ItemTable.svelte';
  import ItemTableHeaderRow from '../../../components/item-list/v1/ItemTableHeaderRow.svelte';
  import ItemTableColumn from '../../../components/item-list/v1/ItemTableColumn.svelte';
  import ItemTableFooter from '../../../components/item-list/ItemTableFooter.svelte';
  import ItemImage from '../../../components/item-list/ItemImage.svelte';
  import ItemTableCell from '../../../components/item-list/v1/ItemTableCell.svelte';
  import ItemControl from '../../../components/item-list/controls/ItemControl.svelte';
  import Notice from 'src/components/notice/Notice.svelte';
  import { declareLocation } from 'src/types/location-awareness.types';
  import ClassicControls from '../shared/ClassicControls.svelte';
  import ActorEffectToggleControl from 'src/components/item-list/controls/ActorEffectToggleControl.svelte';
  import { getSheetContext } from 'src/sheets/sheet-context.svelte';
  import EffectTableRow from 'src/components/item-list/v1/EffectTableRow.svelte';

  let context = $derived(getSheetContext<ActorSheetContextV1>());

  const localize = FoundryAdapter.localize;

  let effectSections = $derived(Object.values<any>(context.effects));

  let noEffects = $derived(
    effectSections.some((section: any) => section.effects.length > 0) === false,
  );

  declareLocation('effects');

  let controls: RenderableClassicControl<{ effect: any }>[] = $derived.by(
    () => {
      let result: RenderableClassicControl<{ effect: any }>[] = [];

      result.push(
        {
          component: ActorEffectToggleControl,
          props: ({ effect }) => ({
            effect: effect,
          }),
        },
        {
          component: ItemControl,
          props: ({ effect }) => ({
            onclick: () => effect.sheet.render(true),
            title: localize('DND5E.EffectEdit'),
            iconCssClass: 'fas fa-edit',
          }),
        },
      );

      if (context.unlocked) {
        result.push({
          component: ItemControl,
          props: ({ effect }) => ({
            onclick: () => effect.deleteDialog(),
            title: localize('DND5E.EffectDelete'),
            iconCssClass: 'fas fa-trash',
          }),
        });
      }

      return result;
    },
  );

  let classicControlsIconWidth = 1.25;

  let classicControlsColumnWidth = $derived(
    `${classicControlsIconWidth * controls.length}rem`,
  );
</script>

<div class="scroll-container flex-column small-gap">
  {#if !context.allowEffectsManagement && context.unlocked}
    <Notice>{localize('TIDY5E.GMOnlyEdit')}</Notice>
  {/if}

  {#if noEffects && !context.unlocked && context.allowEffectsManagement}
    <Notice>{localize('TIDY5E.EmptySection')}</Notice>
  {:else}
    {#each effectSections as section}
      {#if !section.hidden}
        {#if (context.unlocked && context.allowEffectsManagement) || section.effects.length > 0}
          {@const effectEntries = section.effects.map((e: any) => ({
            effect: e,
          }))}

          <ItemTable key={section.label}>
            {#snippet header()}
              <ItemTableHeaderRow>
                <ItemTableColumn primary={true}>
                  {localize(section.label)}
                  <span class="item-table-count">{section.effects.length}</span>
                </ItemTableColumn>
                <ItemTableColumn baseWidth="12.5rem">
                  {localize('DND5E.SOURCE.FIELDS.source.label')}
                </ItemTableColumn>
                <ItemTableColumn baseWidth="7.5rem">
                  {localize('DND5E.Duration')}
                </ItemTableColumn>
                {#if context.editable && context.useClassicControls && context.allowEffectsManagement}
                  <ItemTableColumn baseWidth={classicControlsColumnWidth} />
                {/if}
              </ItemTableHeaderRow>
            {/snippet}
            {#snippet body()}
              {#each effectEntries as { effect } (effect.id)}
                <EffectTableRow
                  activeEffect={effect}
                  attributes={{
                    'data-info-card': 'effect',
                    'data-info-card-entity-uuid': effect.uuid,
                  }}
                >
                  {#snippet children({ toggleSummary })}
                    <ItemTableCell
                      primary={true}
                      attributes={{
                        'data-tidy-effect-name-container': true,
                        'data-effect-id': effect.id,
                      }}
                    >
                      <ItemImage src={effect.img ?? effect.icon} />
                      <a
                        onclick={() => toggleSummary()}
                        class="truncate flex-row align-items-center flex-1"
                      >
                        <span
                          class="align-self-center truncate flex-1"
                          title={effect.name}
                          data-tidy-effect-name={effect.name}
                          >{effect.name}</span
                        >
                      </a>
                    </ItemTableCell>
                    <ItemTableCell baseWidth="12.5rem">
                      <span class="truncate" title={effect.sourceName ?? ''}
                        >{effect.sourceName ?? ''}</span
                      >
                    </ItemTableCell>
                    <ItemTableCell baseWidth="7.5rem">
                      <span class="truncate" title={effect.duration.label ?? ''}
                        >{effect.duration.label ?? ''}</span
                      >
                    </ItemTableCell>
                    {#if context.editable && context.useClassicControls && context.allowEffectsManagement}
                      <ItemTableCell baseWidth={classicControlsColumnWidth}>
                        <ClassicControls
                          {controls}
                          params={{ effect: effect }}
                        />
                      </ItemTableCell>
                    {/if}
                  {/snippet}
                </EffectTableRow>
              {/each}
              {#if context.unlocked && context.allowEffectsManagement}
                <ItemTableFooter
                  actor={context.actor}
                  {section}
                  create={() =>
                    FoundryAdapter.addEffect(section.type, context.actor)}
                  isItem={false}
                />
              {/if}
            {/snippet}
          </ItemTable>
        {/if}
      {/if}
    {/each}
  {/if}
</div>
