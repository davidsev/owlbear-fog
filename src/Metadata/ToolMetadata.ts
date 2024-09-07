import { RoomMetadataMapper } from '@davidsev/owlbear-utils';
import getId from '../getId';

export class ToolMetadata {
    radius: number = 0.25;
}

// FIXME:  This should be toolMetadata, but there's a bug in the SDK?
export const toolMetadata = new RoomMetadataMapper(getId('tool'), new ToolMetadata);
