<script lang="ts">
  import { FoundryAdapter } from 'src/foundry/foundry-adapter';
  import { getCharacterSheetQuadroneContext } from 'src/sheets/sheet-context.svelte';
  import type { SkillToolFavoriteContextEntry } from 'src/types/types';
  import { getModifierData } from 'src/utils/formatting';
  import FavoriteRollButton from './parts/FavoriteRollButton.svelte';
  import { CONSTANTS } from 'src/constants';

  interface Props {
    favorite: SkillToolFavoriteContextEntry;
  }

  let { favorite }: Props = $props();

  let context = $derived(getCharacterSheetQuadroneContext());

  let localize = FoundryAdapter.localize;

  let data = $derived(context.actor.system[`${favorite.type}s`]?.[favorite.id]);

  let modifier = $derived(getModifierData(data.total));

  let subtitle = $derived(
    localize('DND5E.AbilityPromptTitle', {
      ability: CONFIG.DND5E.abilities[data.ability].label,
    }),
  );

  async function handleOnUse(
    event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement },
    _favorite: SkillToolFavoriteContextEntry,
  ) {
    if (favorite.type === 'skill') {
      await context.actor.rollSkill({ skill: favorite.key, event });
      return;
    }

    await context.actor.rollToolCheck({ tool: favorite.key, event });
  }

  let trait: 'skills' | 'tool' = $derived(
    favorite.type === 'skill' ? 'skills' : 'tool',
  );
</script>

<div
  class="list-entry favorite"
  role="button"
  tabindex="0"
  data-favorite-type="tool"
  data-reference-tooltip={favorite.reference}
  data-item-id={favorite.id}
  data-tidy-draggable
  data-favorite-id={favorite.id}
  data-key={favorite.id}
  data-context-menu={CONSTANTS.CONTEXT_MENU_TYPE_KEYED_FAVORITE}
  onmousedown={(event) =>
    FoundryAdapter.doActionOnMiddleClick(event, () =>
      FoundryAdapter.renderSkillToolConfig(
        context.actor,
        trait,
        favorite.key ?? '',
      ),
    )}
  data-tidy-sheet-part="favorite-entry"
>
  <FavoriteRollButton
    {favorite}
    img={favorite.img}
    title={favorite.name}
    onUse={handleOnUse}
    name={favorite.name}
    {subtitle}
    useTooltip={false}
  />
  <div class="">
    <span class="modifier">
      <span class="sign">
        {modifier.sign}
      </span>
      <span>
        {modifier.value}
      </span>
    </span>
    {#if data.passive}
      <span class="passive">({data.passive})</span>
    {/if}
  </div>
</div>
