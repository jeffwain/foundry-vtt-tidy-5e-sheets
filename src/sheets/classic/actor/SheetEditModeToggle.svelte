<script lang="ts">
  import { CONSTANTS } from 'src/constants';
  import { TidyFlags } from 'src/foundry/TidyFlags';
  import TidySwitch from 'src/components/toggles/TidySwitch.svelte';
  import { FoundryAdapter } from 'src/foundry/foundry-adapter';
  import { settings } from 'src/settings/settings.svelte';
  import { getSheetContext } from 'src/sheets/sheet-context.svelte';

  interface Props {
    hint?: string | null;
    [key: string]: any;
  }

  let { hint = null, ...rest }: Props = $props();

  let context = $derived(getSheetContext<{ document: any }>());

  async function toggleLock() {
    await TidyFlags.allowEdit.set(context.document, !allowEdit);
  }

  const localize = FoundryAdapter.localize;
  let allowEdit = $derived(TidyFlags.allowEdit.get(context.document));
  let descriptionVariable = $derived(
    hint ??
      (settings.value.useTotalSheetLock
        ? localize('TIDY5E.SheetLock.Description')
        : localize('TIDY5E.SheetEdit.Description')),
  );
  let lockHintVariable = $derived(
    settings.value.useTotalSheetLock
      ? 'TIDY5E.SheetLock.Unlock.Hint'
      : 'TIDY5E.SheetEdit.Enable.Hint',
  );
  let unlockHintVariable = $derived(
    settings.value.useTotalSheetLock
      ? 'TIDY5E.SheetLock.Lock.Hint'
      : 'TIDY5E.SheetEdit.Disable.Hint',
  );
  let unlockTitle = $derived(
    localize(unlockHintVariable, {
      description: descriptionVariable,
    }),
  );
  let lockTitle = $derived(
    localize(lockHintVariable, {
      description: descriptionVariable,
    }),
  );
</script>

<div
  class="sheet-edit-mode-toggle {rest.class ?? ''}"
  data-tidy-sheet-part={CONSTANTS.SHEET_PARTS.SHEET_LOCK_TOGGLE}
>
  <TidySwitch
    --tidy-switch-scale="1"
    --tidy-switch-thumb-transform-duration="0.15s"
    title={allowEdit ? unlockTitle : lockTitle}
    checked={allowEdit}
    thumbIconClass="{allowEdit ? 'fas fa-unlock' : 'fas fa-lock'} fa-fw"
    onChange={() => toggleLock()}
  ></TidySwitch>
</div>
