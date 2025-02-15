import type { CustomHeaderControlsEntry } from 'src/api/api.types';

export class ImportSheetControl {
  static actionName = 'importFromCompendium';

  static getSheetControl(): CustomHeaderControlsEntry {
    return {
      action: 'importFromCompendium',
      icon: 'fas fa-download',
      label: 'Import',
      visible(this: any) {
        const document = this.document;
        return (
          document.constructor.name !== 'Folder' &&
          !document.isEmbedded &&
          document.compendium &&
          document.constructor.canUserCreate(game.user)
        );
      },
      position: 'header',
    };
  }

  static async importFromCompendium(app: any, document: any) {
    await app.close();
    return document.collection.importFromCompendium(
      document.compendium,
      document.id
    );
  }
}
