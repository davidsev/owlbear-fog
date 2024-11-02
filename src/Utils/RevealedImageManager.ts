import { RevealedImage } from './RevealedImage';
import OBR, { Image, isImage, Item } from '@owlbear-rodeo/sdk';
import getId from './getId';
import { revealTokenMetadata } from '../Metadata/ItemMetadata';

const metadataId = getId('revealToken');

export class RevealedImageManager {
    private revealedImages: Map<string, RevealedImage> = new Map();

    constructor () {
        OBR.scene.items.onChange(this.itemsUpdated.bind(this));
    }

    public async init (): Promise<void> {
        const images = await OBR.scene.items.getItems();
        // Add the local fog cutouts to any images that need it.
        this.itemsUpdated(images);

        // If there's any old cutouts from when they were scene items, remove them.
        // FIXME: remove this when?
        for (const item of images) {
            if (isImage(item) && item.metadata[getId('createdBy')] === metadataId) {
                OBR.scene.local.deleteItems([item.id]);
            }
        }
    }

    private async itemsUpdated (items: Item[]): Promise<void> {
        const role = await OBR.player.getRole();
        for (const item of items) {
            if (isImage(item) && (item.metadata[metadataId] !== undefined || this.revealedImages.has(item.id))) {
                const token = this.getRevealedImage(item);
                const metadata = revealTokenMetadata.get(item);
                token.revealed = metadata.revealed && (item.visible || role === 'GM');
            }
        }
    }

    private getRevealedImage (item: Image): RevealedImage {
        const currentRevealedImage = this.revealedImages.get(item.id);
        if (currentRevealedImage)
            return currentRevealedImage;

        const newRevealedImage = new RevealedImage(item);
        this.revealedImages.set(item.id, newRevealedImage);
        return newRevealedImage;
    }
}
