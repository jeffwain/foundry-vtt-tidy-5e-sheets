<script lang="ts">
  import { FoundryAdapter } from 'src/foundry/foundry-adapter';
  import { getCharacterSheetQuadroneContext } from 'src/sheets/sheet-context.svelte';

  /*
    The Inspiration data type is boolean, so assigning a number is impossible.
    Instead, this will have to be a flag-based, custom thing. Should Tidy do it? We certainly can, and we can provide settings for it.
    If we support banked inspiration points, we should also consider how we might allow integration of a module like "So Inspired!" 
    It could be as providing the Banked Inspiration Badge as an injectable component from the Tidy API.
  */
  let levels = 1 ;
  let currentLevel = $state(1);

  let localize = FoundryAdapter.localize;

  let context = $derived(getCharacterSheetQuadroneContext());

  let inspired = $derived(context.actor.system.attributes.inspiration);

  // TODO: Determine if we can use greensock or something to make a sick animation when inspiration toggles on/off.
</script>

<div
  class="inspiration-badge"
  class:single={levels === 1}
  class:stacked={levels > 1}
>
  {#if levels === 1}
    <button
      type="button"
      class={[
        'inspiration button button-borderless button-icon-only single',
        { inspired: inspired },
      ]}
      aria-label={localize('DND5E.Inspiration')}
      data-tooltip="DND5E.Inspiration"
      onclick={(ev) =>
        context.actor.update({
          ['system.attributes.inspiration']: !inspired,
        })}
    >
    </button>
  {:else}
    <button
      aria-label="Inspiration"
      type="button"
      class="inspiration button button-borderless button-icon-only stacked"
      class:inspired={currentLevel > 0}
    >
      <span class="inspiration-level">
        <span class="level font-data-large color-text-inverse">
          {currentLevel}
        </span>
      </span>
    </button>
    <div class="inspiration-controls">
      <button
        type="button"
        class="button button-borderless button-icon-only"
        aria-label="Remove Inspiration"
        disabled={currentLevel === 0}
        onclick={() => (currentLevel = Math.max(0, currentLevel - 1))}
      >
        <i class="fas fa-hexagon-minus"></i>
      </button>
      <button
        type="button"
        class="button button-borderless button-icon-only"
        aria-label="Add Inspiration"
        disabled={currentLevel === levels}
        onclick={() => (currentLevel = Math.min(levels, currentLevel + 1))}
      >
        <i class="fas fa-hexagon-plus"></i>
      </button>
    </div>
  {/if}
</div>

<style lang="scss">
  .inspiration-controls {
    display: none;
  }
  .inspiration-badge:hover {
    .inspiration-controls {
      display: flex;
      position: absolute;
      left: 0;
      bottom: 0.25rem;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      .button.button-borderless {
        --size: 1.5rem;
        min-width: var(--size);
        border-radius: 100%;
        position: relative;
        i {
          font-size: var(--font-size-14);
          position: relative;
        }

        &:hover {
          background-color: transparent;
        }

        &::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translateY(-50%) translateX(-50%);
          background: rgba(0, 0, 0, 0.5);
          width: 1rem;
          height: 1rem;
          border-radius: 100%;
          z-index: -1;
        }
        &:not(:disabled):hover::before {
          width: 1rem;
          height: 1rem;
          background-color: black;
        }

        &:disabled,
        &:disabled:hover {
          background-color: transparent;
          i {
            color: var(--t5e-color-icon-disabled);
            text-shadow: none;
          }
        }
      }
    }
  }
</style>
