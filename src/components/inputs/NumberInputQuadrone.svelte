<script lang="ts">
  import { type HTMLInputAttributes } from 'svelte/elements';

  type Props = {
    disabledValue?: HTMLInputElement['value'];
    field: string;
    document: any;
    selectOnFocus?: boolean;
    stopClickPropagation?: boolean;
  } & HTMLInputAttributes;

  let {
    disabledValue,
    field,
    document,
    selectOnFocus = false,
    stopClickPropagation = false,
    ...rest
  }: Props = $props();

  let theInput: HTMLInputElement | undefined = $state();

  async function saveChange(
    event: Event & {
      currentTarget: EventTarget & HTMLInputElement;
    },
  ) {
    const proposedValueToSave = parseFloat(event.currentTarget.value);

    const parsedValueToSave = !isNaN(proposedValueToSave)
      ? proposedValueToSave
      : null;

    await document.update({
      [field]: parsedValueToSave,
    });

    if (selectOnFocus && theInput === window.document.activeElement) {
      theInput.select();
    }
  }

  let value = $derived(
    rest.disabled ? (disabledValue ?? rest.value) : rest.value,
  );
</script>

<input
  bind:this={theInput}
  type="number"
  onchange={saveChange}
  onfocus={(ev) => selectOnFocus && ev.currentTarget.select()}
  onclick={(ev) => stopClickPropagation && ev.stopPropagation()}
  data-tidy-field={field}
  {...rest}
  {value}
/>
