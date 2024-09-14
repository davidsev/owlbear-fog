import { ItemMetadataMapper } from '@davidsev/owlbear-utils';
import getId from '../getId';

//
// Item Metadata for the original item.
//

export class RevealTokenMetadata {
    revealed: boolean = false;
}

export const revealTokenMetadata = new ItemMetadataMapper(getId('revealToken'), new RevealTokenMetadata);
