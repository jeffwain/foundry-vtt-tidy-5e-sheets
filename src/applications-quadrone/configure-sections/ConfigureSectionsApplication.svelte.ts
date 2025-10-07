import { CONSTANTS } from 'src/constants';
import type {
  ApplicationConfiguration,
  DocumentSheetApplicationConfiguration,
  DocumentSheetConfiguration,
} from 'src/types/application.types';
import { mount } from 'svelte';
import ConfigureSections from './ConfigureSections.svelte';
import type { TidySectionBase } from 'src/types/types';
import { FoundryAdapter } from 'src/foundry/foundry-adapter';
import { getThemeV2 } from 'src/theme/theme';
import { TidyFlags } from 'src/foundry/TidyFlags';
import type { SectionConfig } from 'src/features/sections/sections.types';
import { DocumentSheetDialog } from '../DocumentSheetDialog.svelte';
import { mapGetOrInsert } from 'src/utils/map';

export type BooleanSetting = {
  type: 'boolean';
  label: string;
  checked?: boolean;
  prop: string;
  doc?: any;
  default?: boolean;
};

export type RadioSettingOption<TValue> = {
  label: string;
  value: TValue;
  checked?: boolean;
};

export type RadioSetting<TValue> = {
  type: 'radio';
  options: RadioSettingOption<TValue>[];
  selected?: TValue;
  prop: string;
  doc?: any;
  default?: TValue;
};

export type ButtonSetting = {
  type: 'button';
  icon?: string;
  label?: string;
  onclick: (ev: MouseEvent & { currentTarget: HTMLElement }, doc: any) => void;
};

export type SectionSetting = BooleanSetting | RadioSetting<any> | ButtonSetting;

export type SectionOptionGroup = {
  title: string;
  settings: SectionSetting[];
};

export type ConfigureSectionsApplicationConstructorArgs = {
  settings: {
    optionsGroups?: SectionOptionGroup[];
    sections: TidySectionBase[];
    tabId: string;
    formTitle: string;
  };
} & DocumentSheetApplicationConfiguration;

export type SectionConfigItem = {
  key: string;
  label: string;
  show: boolean;
};

export class ConfigureSectionsApplication extends DocumentSheetDialog() {
  sections = $state<SectionConfigItem[]>([]);
  optionsGroups = $state<SectionOptionGroup[]>([]);
  tabId: string;
  theme: string = $state<string>('');
  formTitle: string;

  constructor({
    settings: { sections, tabId, optionsGroups, formTitle },
    ...rest
  }: ConfigureSectionsApplicationConstructorArgs) {
    super(rest);
    this.sections = sections.map((section) => ({
      key: section.key,
      label: FoundryAdapter.localize(section.label),
      show: section.show !== false,
    }));
    this.optionsGroups = [...(optionsGroups ?? [])];
    this.tabId = tabId;
    this.theme = getThemeV2(rest.document);
    this.formTitle = formTitle;
  }

  static DEFAULT_OPTIONS: Partial<
    ApplicationConfiguration & { dragDrop: Partial<DragDropConfiguration>[] }
  > = {
    classes: [CONSTANTS.MODULE_ID, 'quadrone', 'tab-configuration'],
    tag: 'div',
    sheetConfig: false,
    window: {
      frame: true,
      positioned: true,
      resizable: true,
      controls: [],
    },
    position: {
      width: 550,
      height: 600,
    },
    actions: {},
    submitOnClose: false,
  };

  _createComponent(node: HTMLElement): Record<string, any> {
    const context = new Map<any, any>([]);

    const component = mount(ConfigureSections, {
      target: node,
      context: context,
      props: {
        sections: this.sections,
        application: this,
        optionGroups: this.optionsGroups,
        title: this.formTitle,
      },
    });

    return component;
  }

  async _preRender(...args: any[]) {
    super._preRender(...args);

    for (const group of this.optionsGroups) {
      for (const setting of group.settings) {
        if (setting.type === 'button') {
          return;
        }

        const doc = setting.doc ?? this.document;
        if (setting.type === 'boolean') {
          setting.checked =
            foundry.utils.getProperty(doc, setting.prop) ?? setting.default;
        } else if (setting.type === 'radio') {
          const selected =
            foundry.utils.getProperty(doc, setting.prop) ?? setting.default;
          setting.selected = selected;
        }
      }
    }
  }

  /* -------------------------------------------- */

  /** @override */
  _onClose(..._: any[]) {}

  /* -------------------------------------------- */

  /** @override */
  _onFirstRender(..._: any[]) {}

  /* -------------------------------------------- */

  async saveChanges() {
    const thisDocumentData: Record<string, any> = {};
    const documentsToSave: Map<any, Record<string, any>> = new Map([
      [this.document, thisDocumentData],
    ]);

    for (const group of this.optionsGroups) {
      for (const setting of group.settings) {
        if (setting.type === 'button') {
          continue;
        }

        const doc = setting.doc ?? this.document;
        const toSave = mapGetOrInsert(documentsToSave, doc, {});

        if (setting.type === 'boolean') {
          toSave[setting.prop] = setting.checked;
        } else if (setting.type === 'radio') {
          toSave[setting.prop] = setting.selected;
        }
      }
    }

    const sectionConfig = TidyFlags.sectionConfig.get(this.document) ?? {};

    sectionConfig[this.tabId] = this.sections.reduce<
      Record<string, SectionConfig>
    >((result, curr, i) => {
      result[curr.key] = {
        key: curr.key,
        order: i,
        show: curr.show !== false,
      };
      return result;
    }, {});

    thisDocumentData[TidyFlags.sectionConfig.prop] = sectionConfig;

    for (const [doc, toSave] of documentsToSave) {
      await doc.update(toSave);
    }

    this.close();
  }

  async useDefault() {
    const proceed = await foundry.applications.api.DialogV2.confirm({
      window: {
        title: FoundryAdapter.localize('TIDY5E.UseDefaultDialog.title'),
      },
      content: `<p>${FoundryAdapter.localize(
        'TIDY5E.UseDefaultDialog.text'
      )}</p>`,
    });

    if (!proceed) {
      return;
    }

    const sectionConfig = TidyFlags.sectionConfig.get(this.document) ?? {};
    delete sectionConfig[this.tabId];
    // TODO: Figure out how to do this in a less suppressing way.
    //@ts-expect-error
    sectionConfig[`-=${this.tabId}`] = null;
    await this.document.update({
      [TidyFlags.sectionConfig.prop]: sectionConfig,
    });
    await this.close();
  }
}
