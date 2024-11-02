import { ContextMenuIcon, ContextMenuItem, isImage } from '@owlbear-rodeo/sdk';
import getId from '../Utils/getId';
import { ContextMenuContext } from '@owlbear-rodeo/sdk/lib/types/ContextMenu';
import { revealTokenMetadata } from '../Metadata/ItemMetadata';
import { ImageRevealer } from '../Utils/ImageRevealer';

export class RevealToken implements ContextMenuItem {

    public readonly id = getId('revealToken');
    public readonly icons: ContextMenuIcon[] = [{
        icon: URL_PREFIX + '/reveal.svg',
        label: 'Reveal through fog',
        filter: {
            roles: ['GM'] as 'GM'[],
            every: [
                { key: 'type', value: 'IMAGE' },
            ],
            some: [
                { key: ['metadata', getId('revealToken'), 'revealed'], operator: '!=', value: true },
            ],
        },
    }];

    public async onClick (context: ContextMenuContext, elementId: string): Promise<void> {

        const promises = [];
        for (const item of context.items) {
            const metadata = revealTokenMetadata.get(item);
            if (isImage(item) && !metadata.revealed)
                promises.push(new ImageRevealer(item).reveal());
        }
        await Promise.all(promises);
    }
}
