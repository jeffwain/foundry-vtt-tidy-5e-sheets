<script lang="ts">
  import { FoundryAdapter } from 'src/foundry/foundry-adapter';
  import { getNpcSheetQuadroneContext } from 'src/sheets/sheet-context.svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import NpcSubtitle from './npc-parts/NpcSubtitle.svelte';
  import TextInputQuadrone from 'src/components/inputs/TextInputQuadrone.svelte';
  import { getModifierData } from 'src/utils/formatting';
  import AbilityScoreNPC from './character-parts/AbilityScoreNPC.svelte';
  import CharacterPortrait from './character-parts/CharacterPortrait.svelte';
  import CharacterExhaustionBar from './character-parts/CharacterExhaustionBar.svelte';
  import Tabs from 'src/components/tabs/Tabs.svelte';
  import TabContents from 'src/components/tabs/TabContents.svelte';
  import NpcSidebar from './npc-parts/NpcSidebar.svelte';
  import { SheetPreferencesService } from 'src/features/user-preferences/SheetPreferencesService';
  import { untrack } from 'svelte';

  let context = $derived(getNpcSheetQuadroneContext());

  let appId = $derived(context.actor.uuid.slugify());

  let localize = FoundryAdapter.localize;

  let selectedTabId: string = $derived(context.currentTabId);

  let sidebarExpanded = $state(true);

  // When the user changes tabs, check their preference on the new tab and apply expanded state.
  $effect(() => {
    const type = untrack(() => context.actor.type);

    sidebarExpanded =
      SheetPreferencesService.getByType(type)?.tabs?.[selectedTabId]
        ?.sidebarExpanded == true;
  });

  // When the user expands or collapses the sidebar, remember their preference for this tab.
  $effect(() => {
    SheetPreferencesService.setDocumentTypeTabPreference(
      untrack(() => context.actor.type),
      untrack(() => selectedTabId),
      'sidebarExpanded',
      sidebarExpanded,
    );
  });

  let hpValueInputFocused = $state(false);
  let hpTempInputFocused = $state(false);
  let exhaustionBarFocused = $state(false);

  let hpValueInput = $state<TextInputQuadrone>();
  let hpTempInput = $state<TextInputQuadrone>();

  let hpValue = $derived(context.system.attributes?.hp?.value ?? 0);
  let hpMax = $derived(context.system.attributes?.hp?.max ?? 0);
  let hpPct = $derived(context.system.attributes?.hp?.pct ?? 0);
  let hpTemp = $derived(context.system.attributes?.hp?.temp ?? 0);
  let hpTempMax = $derived(context.system.attributes?.hp?.tempMax ?? 0);

  let exhaustionLevel = $derived(context.system.attributes.exhaustion);

  let ini = $derived(getModifierData(context.system.attributes.init.total));

  let formattedCr = $derived(dnd5e.utils.formatCR(context.system.details.cr));

  function calculateSaveCr(crValue: string): boolean {
    const crs: Record<string, number> = {
      '1/8': 0.125,
      '⅛': 0.125,
      '1/4': 0.25,
      '¼': 0.25,
      '1/2': 0.5,
      '½': 0.5,
    };

    let cr: string | number | null = crValue;
    if (cr === '' || cr === '—') cr = null;
    else {
      cr = crs[cr] || parseFloat(cr);
      if (Number.isNaN(cr)) {
        cr = null;
      } else {
        cr = cr < 1 ? cr : parseInt(cr.toString());
      }
    }

    context.actor.update({ 'system.details.cr': cr });

    return false;
  }

  let extraTabs = new SvelteSet<string>();
</script>

<header class="sheet-header flexcol">
  <div class="sheet-header-content flexrow">
    <div class="actor-details-container flexcol">
      <div class="actor-context-row flexrow">
        <div class="flexcol flex1">
          <div class="actor-details-name-row">
            {#if context.unlocked}
              <TextInputQuadrone
                field="name"
                document={context.actor}
                value={context.actor.name}
                class="actor-name flex1 h2"
              />
            {:else}
              <h1 class="actor-name flex1">{context.actor.name}</h1>
            {/if}
            <div
              class={['sheet-header-actions', 'flexrow']}
              data-tidy-sheet-part="sheet-header-actions-container"
            >
              <button
                type="button"
                class="button button-icon-only short-rest button-gold"
                data-tooltip="DND5E.REST.Short.Label"
                aria-label={localize('DND5E.REST.Short.Label')}
                onclick={() => context.actor.shortRest()}
                disabled={!context.editable}
              >
                <i class="fas fa-utensils"></i>
              </button>
              <button
                type="button"
                class="button button-icon-only long-rest button-gold"
                data-tooltip="DND5E.REST.Long.Label"
                aria-label={localize('DND5E.REST.Long.Label')}
                onclick={() => context.actor.longRest()}
                disabled={!context.editable}
              >
                <i class="fas fa-campground"></i>
              </button>
            </div>
          </div>
          <NpcSubtitle />
        </div>
        <div
          class="level-container challenge-rating flex0 flexrow"
          aria-label={localize('DND5E.CRLabel', {
            cr: context.system.details.cr,
          })}
          title={!context.unlocked ? localize('DND5E.ChallengeRating') : ''}
        >
          <label
            for="{context.appId}-system-details-cr"
            class="label font-label-medium color-text-gold-emphasis"
          >
            {localize('DND5E.AbbreviationCR')}
          </label>
          {#if context.unlocked}
            <TextInputQuadrone
              document={context.actor}
              value={formattedCr}
              field="system.details.cr"
              class="challenge-rating-input font-data-xlarge"
              selectOnFocus={true}
              data-tooltip="DND5E.ChallengeRating"
              id="{context.appId}-system-details-cr"
              onSaveChange={(ev) => calculateSaveCr(ev.currentTarget.value)}
            />
          {:else}
            <span class="value font-data-xlarge color-text-default"
              >{formattedCr}</span
            >
          {/if}
        </div>
      </div>
      <div
        class={[
          'abilities-container',
          { ['abilities-overflow']: context.abilities.length > 6 },
          'flexrow',
        ]}
      >
        <div class="abilities-container-inner flexrow">
          <div class="initiative-container flexcol">
            <div class="initiative score bonus-container" data-tooltip="DND5E.Initiative">
              <button
                type="button"
                class="button-borderless initiative-roll-button"
                onclick={(event) =>
                  context.actor.rollInitiativeDialog({ event: event })}
              >
                {localize('DND5E.InitiativeAbbr')}
              </button>
              {#if context.unlocked}
                <button
                  aria-label={localize('DND5E.InitiativeConfig')}
                  data-tooltip="DND5E.InitiativeConfig"
                  type="button"
                  class="button button-borderless button-icon-only button-config"
                  onclick={() =>
                    FoundryAdapter.renderInitiativeConfig(context.actor)}
                >
                  <i class="fas fa-cog"></i>
                </button>
              {/if}
              <div class="initiative-bonus flexrow">
                <span class="modifier color-text-lightest font-label-xlarge">
                  {ini.sign}
                </span>
                <span class="bonus color-text-default font-data-xlarge">
                  {ini.value}
                </span>
              </div>
            </div>
            <div class="ability-labels flexcol">
              <span class="label font-label-medium color-text-lightest"
                >{localize('DND5E.AbilityScoreShort')}</span
              >
              <span class="divider"></span>
              <span class="label font-label-medium color-text-lightest"
                >{localize('DND5E.SavingThrowShort')}</span
              >
            </div>
          </div>
          {#each context.abilities as ability}
            <AbilityScoreNPC
              {ability}
              unlocked={context.unlocked}
              onScoreChanged={(score) =>
                context.actor.update({
                  [`system.abilities.${ability.key}.value`]: score,
                })}
              onConfigClicked={(id) =>
                FoundryAdapter.renderAbilityConfig(context.actor, id)}
              onRollAbility={(event, key) =>
                context.actor.rollAbilityCheck({ ability: key, event })}
              onRollSave={(event, key) =>
                context.actor.rollSavingThrow({ ability: key, event })}
            />
          {/each}
        </div>
      </div>
    </div>
    <div class="actor-vitals-container">
      <CharacterPortrait />
      <div class="actor-vitals npc-vitals theme-dark">
        <div class="hp-row flexrow">
          <div
            class="meter progress hit-points"
            style="--bar-percentage: {hpPct.toFixed(0)}%"
          >
            <button
              type="button"
              class="label pointer"
              hidden={hpValueInputFocused}
              onclick={async (ev) => {
                hpValueInputFocused = true;
                hpValueInput?.selectText();
              }}
            >
              <div
                class="value {hpTemp > 99 || hpValue > 999 ? 'font-medium' : 'font-data-large'}"
                aria-label={localize('DND5E.HitPointsCurrent')}
              >
                {hpValue}
              </div>
              <div
                class="separator {hpTemp > 99 || hpValue > 999
                  ? 'font-medium'
                  : 'font-default-large'}"
              >
                /
              </div>
              <div
                class="max {hpTemp > 99 || hpValue > 999 ? 'font-medium' : 'font-data-large'}"
                aria-label={localize('DND5E.HitPointsMax')}
              >
                {hpMax}
              </div>
            </button>
            <TextInputQuadrone
              bind:this={hpValueInput}
              id="{appId}-system-attributes-hp"
              document={context.actor}
              field="system.attributes.hp.value"
              class="hp-input"
              value={hpValue}
              selectOnFocus={true}
              enableDeltaChanges={true}
              onfocus={() => (hpValueInputFocused = true)}
              onblur={() => (hpValueInputFocused = false)}
              blurAfterChange={true}
              hidden={!hpValueInputFocused}
            />
          </div>

          {#if !context.unlocked}
            {#if hpTemp > 0 || hpTempInputFocused}
              <!-- TODO: Convert to buttons -->
              <div
                class="temp-hp label pointer"
                hidden={hpTempInputFocused}
                onclick={async (ev) => {
                  hpTempInputFocused = true;
                  hpTempInput?.selectText();
                }}
              >
                <span
                  class="modifier {hpTemp > 99 || hpValue > 999
                    ? 'font-medium font-label-medium'
                    : 'font-label-large'} color-text-lighter">+</span
                >
                <span
                  class="value {hpTemp > 99 || hpValue > 999
                    ? 'font-medium font-data-medium'
                    : 'font-data-large'} color-text-default"
                  data-tooltip="DND5E.HitPointsTemp">{hpTemp}</span
                >
              </div>
              <TextInputQuadrone
                bind:this={hpTempInput}
                id="{appId}-system-attributes-hp-temp"
                document={context.actor}
                field="system.attributes.hp.temp"
                class="hp-temp-input"
                value={hpTemp}
                selectOnFocus={true}
                enableDeltaChanges={true}
                onfocus={() => (hpTempInputFocused = true)}
                onblur={() => (hpTempInputFocused = false)}
                blurAfterChange={true}
                hidden={!hpTempInputFocused}
              />
            {:else}
              <button
                aria-label={localize('DND5E.HitPointsTemp')}
                data-tooltip="DND5E.HitPointsTemp"
                type="button"
                class="button button-borderless button-icon-only temp-hp"
                onclick={async (ev) => {
                  hpTempInputFocused = true;
                  hpTempInput?.selectText();
                }}
              >
                <i class="fas fa-hand-holding-heart"></i>
              </button>
            {/if}
          {:else}
            <button
              onclick={() =>
                FoundryAdapter.renderHitPointsDialog(context.actor)}
              aria-label={localize('DND5E.HitPointsConfig')}
              data-tooltip="DND5E.HitPointsConfig"
              type="button"
              class={[
                'button',
                'button-borderless',
                'button-icon-only',
                'button-config',
                { editMode: context.unlocked },
              ]}
            >
              <i class="fas fa-cog"></i>
            </button>
          {/if}
        </div>
        <div class="actor-vitals-row">
          {#if exhaustionBarFocused}
            <CharacterExhaustionBar
              level={exhaustionLevel}
              total={context.config.conditionTypes.exhaustion.levels}
              onClose={() => (exhaustionBarFocused = false)}
              onExhaustionLevelSet={async (level) => {
                await context.actor.update({
                  'system.attributes.exhaustion': level,
                });
              }}
            />
          {:else}
            <div class={['exhaustion', { exhausted: exhaustionLevel > 0 }]}>
              <button
                type="button"
                class="button button-borderless button-icon-only"
                aria-label={localize('DND5E.Exhaustion')}
                data-tooltip={'DND5E.Exhaustion'}
                onclick={() => (exhaustionBarFocused = !exhaustionBarFocused)}
              >
                <i class="fas fa-heart-pulse"></i>
                <span class="value">{exhaustionLevel}</span>
              </button>
            </div>

            <button
              type="button"
              class="max-hp button button-borderless"
              aria-label={localize('DND5E.HitPointsTempMax')}
              data-tooltip={'DND5E.HitPointsTempMax'}
              onclick={() => console.log('TODO: Roll NPC HP')}
            >
              Max
            </button>

            <button
              type="button"
              class="roll-hp button button-borderless button-icon-only"
              aria-label={localize('DND5E.HPFormulaRollMessage')}
              data-tooltip={'DND5E.HPFormulaRollMessage'}
              onclick={() => console.log('TODO: Roll NPC HP')}
            >
              <i class="fas fa-dice"></i>
            </button>

            <div class={['death-saves', { dying: context.showDeathSaves }]}>
              {#if context.unlocked}
                <button
                  aria-label={localize('DND5E.DeathSaveConfigure')}
                  data-tooltip="DND5E.DeathSaveConfigure"
                  type="button"
                  class="button button-borderless button-icon-only button-config"
                  onclick={(ev) =>
                    FoundryAdapter.renderDeathConfig(context.actor)}
                >
                  <i class="fas fa-cog"></i>
                </button>
              {:else}
                <button
                  type="button"
                  class="button button-borderless button-icon-only"
                  aria-label={localize('DND5E.DeathSave')}
                  data-tooltip="DND5E.DeathSave"
                  onclick={() => context.actor.sheet.toggleDeathSaves()}
                >
                  <i class="fas fa-skull"></i>
                </button>
              {/if}
            </div>

            <!-- {#if context.unlocked}
              <button
                aria-label="Configure NPC"
                data-tooltip="DND5E.DeathSaveConfigure"
                type="button"
                class="button button-borderless button-icon-only button-config"
                onclick={(ev) =>
                  FoundryAdapter.renderDeathConfig(context.actor)}
              >
                <i class="fas fa-cog"></i>
              </button>
            {/if} -->
          {/if}
        </div>
      </div>
      <div
        class="shield"
        data-attribution="attributes.ac"
        data-attribution-caption="DND5E.ArmorClass"
        data-tooltip-direction="DOWN"
      >
        <span class="ac-label font-label-medium color-text-gold">AC</span>
        <span class="ac-value color-text-default">
          {context.system.attributes.ac.value}
        </span>
        {#if context.unlocked}
          <button
            aria-label={localize('DND5E.ArmorConfig')}
            data-tooltip="DND5E.ArmorConfig"
            type="button"
            class="button button-borderless button-icon-only button-config"
            onclick={(ev) => FoundryAdapter.renderArmorConfig(context.actor)}
          >
            <i class="fas fa-cog"></i>
          </button>
        {/if}
      </div>
    </div>
  </div>
  <div class="tabs-row">
    <a
      class="sidebar-toggle button button-borderless"
      data-tooltip={localize(
        sidebarExpanded ? 'JOURNAL.ViewCollapse' : 'JOURNAL.ViewExpand',
      )}
      onclick={() => (sidebarExpanded = !sidebarExpanded)}
    >
      {#if sidebarExpanded}
        <i class="fa-solid fa-caret-left"></i>
        <i class="fa-solid fa-sidebar-flip"></i>
      {:else}
        <i class="fa-solid fa-sidebar"></i>
        <i class="fa-solid fa-caret-right"></i>
      {/if}
    </a>
    <Tabs
      bind:selectedTabId
      {extraTabs}
      tabs={context.tabs}
      sheet={context.actor.sheet}
      cssClass="actor-tabs"
      tabContext={{ context, actor: context.actor }}
    />
  </div>
</header>
<div class="sheet-body">
  <div class="main-content">
    <div class={['sidebar flexcol', { expanded: sidebarExpanded }]}>
      <NpcSidebar />
    </div>

    <TabContents
      tabs={context.tabs}
      {selectedTabId}
      {extraTabs}
      cssClass="tidy-tab-contents"
    />
  </div>
</div>
