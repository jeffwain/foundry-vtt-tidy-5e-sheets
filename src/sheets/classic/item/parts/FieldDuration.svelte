<script lang="ts">
  import Select from 'src/components/inputs/Select.svelte';
  import SelectOptions from 'src/components/inputs/SelectOptions.svelte';
  import TextInput from 'src/components/inputs/TextInput.svelte';
  import { FoundryAdapter } from 'src/foundry/foundry-adapter';
  import { getItemSheetContext } from 'src/sheets/sheet-context.svelte';

  let context = $derived(getItemSheetContext());

  let appId = $derived(context.document.id);

  const localize = FoundryAdapter.localize;
</script>

<!-- Duration -->
<div class="form-group split-group">
  <label for="{appId}-duration-units">{localize('DND5E.Duration')}</label>
  <div class="form-fields">
    <!-- Amount -->
    {#if context.system.duration.scalar}
      <div class="form-group label-top">
        <label for="{appId}-duration-value">{localize('DND5E.Amount')}</label>
        <TextInput
          id="{appId}-duration-value"
          document={context.item}
          field="system.duration.value"
          value={context.source.duration.value}
          placeholder="—"
          disabled={!context.editable}
        />
      </div>
    {/if}

    <!-- Time -->
    <div class="form-group label-top">
      <label for="{appId}-duration-units"
        >{localize('DND5E.DurationTime')}</label
      >
      <Select
        id="{appId}-duration-units"
        document={context.item}
        field="system.duration.units"
        value={context.source.duration.units}
        disabled={!context.editable}
      >
        <SelectOptions
          data={context.durationUnits}
          labelProp="label"
          valueProp="value"
        />
      </Select>
    </div>
  </div>

  <!-- Conditions -->
  {#if context.system.duration.units === 'spec'}
    <TextInput
      id="{appId}-duration-special"
      document={context.item}
      field="system.duration.special"
      value={context.source.duration.special}
      placeholder={localize('DND5E.DURATION.FIELDS.duration.special.label')}
      class="full-width"
      disabled={!context.editable}
    />
  {/if}
</div>
