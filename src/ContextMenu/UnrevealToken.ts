import OBR, { ContextMenuIcon, ContextMenuItem, Image, isImage } from '@owlbear-rodeo/sdk';
import getId from '../getId';
import { ContextMenuContext } from '@owlbear-rodeo/sdk/lib/types/ContextMenu';
import { revealTokenMetadata } from '../Metadata/ItemMetadata';

export class UnrevealToken implements ContextMenuItem {

    public readonly id = getId('unrevealToken');
    public readonly icons: ContextMenuIcon[] = [{
        icon: URL_PREFIX + '/unreveal.svg',
        label: 'Unreveal through fog',
        filter: {
            roles: ['GM'] as 'GM'[],
            every: [
                { key: 'type', value: 'IMAGE' },
            ],
            some: [
                { key: ['metadata', getId('revealToken'), 'revealed'], operator: '==', value: true },
            ],

        },
    }];

    public async onClick (context: ContextMenuContext, elementId: string): Promise<void> {

        const promises = [];
        for (const item of context.items) {
            const metadata = revealTokenMetadata.get(item);
            if (isImage(item) && metadata.revealed)
                promises.push(this.unrevealImage(item));
        }
        await Promise.all(promises);
    }

    private async unrevealImage (item: Image): Promise<void> {

        const attachedItems = await OBR.scene.items.getItemAttachments([item.id]);
        const itemsToDelete = attachedItems.filter(i => i.metadata?.['createdBy'] === getId('revealToken'));
        await OBR.scene.items.deleteItems(itemsToDelete.map(i => i.id));
        OBR.scene.items.updateItems([item], ([item]) => {
            revealTokenMetadata.set(item, { revealed: false });
        });
    }
}
