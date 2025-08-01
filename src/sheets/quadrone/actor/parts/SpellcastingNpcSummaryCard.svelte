<script lang="ts">
  import NumberInputQuadrone from 'src/components/inputs/NumberInputQuadrone.svelte';
  import SelectOptions from 'src/components/inputs/SelectOptions.svelte';
  import SelectQuadrone from 'src/components/inputs/SelectQuadrone.svelte';
  import { FoundryAdapter } from 'src/foundry/foundry-adapter';
  import { getNpcSheetContext } from 'src/sheets/sheet-context.svelte';
  import type { NpcSpellcastingContext } from 'src/types/types';

  interface Props {
    info: NpcSpellcastingContext;
    mode: 'expanded' | 'compact';
  }

  let { info, mode }: Props = $props();

  const localize = FoundryAdapter.localize;

  let context = $derived(getNpcSheetContext());
</script>

{#if mode === 'expanded'}
  <div
    class={[
      'spellcasting-class-card flexrow',
      {
        primary: true,
      },
    ]}
    data-ability={info.ability.key}
  >
    <div class="header flexshrink">
      <span class="name font-title-small">{info.name}</span>

      <i
        data-tooltip="DND5E.SpellAbility"
        class="fa-solid fa-chess-queen primary-icon color-text-gold-emphasis"
      >
      </i>
    </div>
    <div class="info pills flex1">
      <div class="spellcasting-ability pill pill-medium">
        {#if context.unlocked}
          {@render abilitySelector('label')}
        {:else}
          {info.ability.label}
        {/if}
      </div>
      <div class="ability pill pill-medium">
        <span class="label font-label-medium color-text-lighter"
          >{localize('DND5E.Ability')}</span
        >
        <span class="value">
          <span class="sign font-label-medium color-text-lightest"
            >{info.ability.mod.sign}</span
          ><span class="font-data-medium">{info.ability.mod.value}</span>
        </span>
      </div>
      <div class="attack pill pill-medium">
        <span class="label font-label-medium color-text-lighter"
          >{localize('DND5E.Attack')}</span
        >
        <span class="value">
          <span class="sign font-label-medium color-text-lightest"
            >{info.attack.mod.sign}</span
          ><span class="font-data-medium">{info.attack.mod.value}</span>
        </span>
      </div>
      <div class="save pill pill-medium">
        <span class="label font-label-medium color-text-lighter"
          >{localize('DND5E.SpellDC')}</span
        >
        <span class="value">
          <span class="font-data-medium">{info.save}</span>
        </span>
      </div>
      <div class="level pill pill-medium">
        <span class="label font-label-medium color-text-lighter"
          >{localize('DND5E.SpellcasterLevel')}</span
        >
        <span class="value">
          {#if context.unlocked}
            {@render levelSelector()}
          {:else}
            <span class="font-data-medium">{info.level}</span>
          {/if}
        </span>
      </div>
    </div>
  </div>
{:else}
  <div
    class={[
      'spellcasting-class-card compact flexrow',
      {
        primary: true,
      },
    ]}
    data-ability={info.ability.key}
  >
    <div class="header flexshrink">
      <span class="name font-title-small">{info.name}</span>

      <i
        data-tooltip="DND5E.SpellAbility"
        class="fa-solid fa-chess-queen primary-icon color-text-gold-emphasis"
      >
      </i>
    </div>
    <div class="info pills flex1">
      <div
        class="ability"
        data-tooltip={localize('DND5E.Ability') + ': ' + info.ability.label}
      >
        {#if context.unlocked}
          <span class="label uppercase">
            {@render abilitySelector('abbr')}
          </span>
        {:else}
          <span class="label font-label-medium color-text-gold uppercase"
            >{info.ability.abbreviation}</span
          >
        {/if}
        <span class="value">
          <span class="sign font-label-medium color-text-lightest"
            >{info.ability.mod.sign}</span
          ><span class="font-data-medium">{info.ability.mod.value}</span>
        </span>
      </div>
      <div class="divider-dot"></div>
      <div class="attack">
        <span class="label font-label-medium color-text-lighter"
          >{localize('DND5E.Attack')}</span
        >
        <span class="value">
          <span class="sign font-label-medium color-text-lightest"
            >{info.attack.mod.sign}</span
          ><span class="font-data-medium">{info.attack.mod.value}</span>
        </span>
      </div>
      <div class="divider-dot"></div>
      <div class="save" data-tooltip={localize('DND5E.SpellDC')}>
        <span class="label font-label-medium color-text-lighter"
          >{localize('DND5E.AbbreviationDC')}</span
        >
        <span class="value">
          <span class="font-data-medium">{info.save}</span>
        </span>
      </div>
      <div class="divider-dot"></div>
      <div class="level">
        <span class="label font-label-medium color-text-lighter"
          >{localize('DND5E.SpellcasterLevel')}</span
        >
        <span class="value">
          {#if context.unlocked}
            {@render levelSelector()}
          {:else}
            <span class="font-data-medium">{info.level}</span>
          {/if}
        </span>
      </div>
    </div>
  </div>
{/if}

{#snippet abilitySelector(labelProp: string)}
  <SelectQuadrone
    document={context.document}
    field="system.attributes.spellcasting"
    value={context.system.attributes.spellcasting}
    blankValue=""
  >
    <SelectOptions
      blank=""
      data={context.abilities}
      {labelProp}
      valueProp="key"
    />
  </SelectQuadrone>
{/snippet}

{#snippet levelSelector()}
  <NumberInputQuadrone
    document={context.document}
    field="system.attributes.spell.level"
    value={context.system.attributes.spell.level}
    min="0"
    step="1"
    placeholder="—"
  />
{/snippet}
