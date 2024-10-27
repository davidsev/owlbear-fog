import { ContextMenuIcon, ContextMenuItem, isImage } from '@owlbear-rodeo/sdk';
import getId from '../Utils/getId';
import { ContextMenuContext } from '@owlbear-rodeo/sdk/lib/types/ContextMenu';
import { revealTokenMetadata } from '../Metadata/ItemMetadata';
import { ImageRevealer } from '../Utils/ImageRevealer';
import { CanvasKit } from 'canvaskit-wasm';

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

    constructor (public readonly canvasKit: CanvasKit) {}

    public async onClick (context: ContextMenuContext, elementId: string): Promise<void> {

        const promises = [];
        for (const item of context.items) {
            const metadata = revealTokenMetadata.get(item);
            if (isImage(item) && metadata.revealed)
                promises.push(new ImageRevealer(this.canvasKit, item).unreveal());
        }
        await Promise.all(promises);
    }
}
