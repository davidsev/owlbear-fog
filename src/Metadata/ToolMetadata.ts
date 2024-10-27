import getId from '../Utils/getId';
import { CachedRoomMetadata } from '@davidsev/owlbear-utils/js/Metadata/Cached/Room';

export class ToolMetadata {
    radius: number = 0.25;
}

// FIXME:  This should be toolMetadata, but there's a bug in the SDK?
export const toolMetadata = new CachedRoomMetadata(getId('tool'), new ToolMetadata);
