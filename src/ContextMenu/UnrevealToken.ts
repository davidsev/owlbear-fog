import OBR, { ContextMenuIcon, ContextMenuItem, isImage } from '@owlbear-rodeo/sdk';
import getId from '../Utils/getId';
import { ContextMenuContext } from '@owlbear-rodeo/sdk/lib/types/ContextMenu';
import { revealTokenMetadata } from '../Metadata/ItemMetadata';

export class UnrevealToken implements ContextMenuItem {

    public readonly id = getId('unrevealToken');
    public readonly icons: ContextMenuIcon[] = [{
        icon: URL_PREFIX + '/unreveal.svg',
        label: 'Unreveal through fog',
        filter: {
            roles: ['GM'] as 'GM'[],
            some: [
                { key: ['metadata', getId('revealToken'), 'revealed'], operator: '==', value: true },
            ],

        },
    }];

    public async onClick (context: ContextMenuContext, elementId: string): Promise<void> {

        const promises: Promise<void>[] = [];
        for (const item of context.items) {
            const metadata = revealTokenMetadata.get(item);
            if (isImage(item) && metadata.revealed)
                promises.push(OBR.scene.items.updateItems([item], ([item]) => {
                    revealTokenMetadata.set(item, { revealed: false });
                }));
        }
        await Promise.all(promises);
    }
}
