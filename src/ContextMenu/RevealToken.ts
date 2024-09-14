import OBR, { buildPath, ContextMenuIcon, ContextMenuItem, Image, isImage } from '@owlbear-rodeo/sdk';
import getId from '../getId';
import { CanvasKit, Path } from 'canvaskit-wasm';
import { Image as ImageJs } from 'image-js';
import { ContextMenuContext } from '@owlbear-rodeo/sdk/lib/types/ContextMenu';
import { potrace } from 'esm-potrace-wasm';
import { grid } from '@davidsev/owlbear-utils';
import { skiaPathToObrPath } from '../skiaPathToObrPath';
import { revealTokenMetadata } from '../Metadata/ItemMetadata';

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

    constructor (public readonly canvasKit: CanvasKit) {
    }

    public async onClick (context: ContextMenuContext, elementId: string): Promise<void> {

        const promises = [];
        for (const item of context.items) {
            const metadata = revealTokenMetadata.get(item);
            if (isImage(item) && !metadata.revealed)
                promises.push(this.revealImage(item));
        }
        await Promise.all(promises);
    }

    private async revealImage (item: Image): Promise<void> {
        // Load the image and pull out just the alpha channel.
        // FIXME: If no alpha channel, then it's square and we can just reveal the whole thing.
        const originalImage = await ImageJs.load(item.image.url);
        if (!originalImage.alpha)
            return;

        // Turn the alpha channel into a 1-bit mask.  Split it at 80% opacity, we don't want to reveal any bits that
        //   are too see-through (eg shadows and halos) but we also dont want to remove bits that look solid.
        //   This feels like an ok-ish compromise.
        // We also shrink the mask so the path doesn't have too many points.  This comes out to 75 px per cell.
        const maskScaleFactorX = item.scale.x / (item.grid.dpi / grid.dpi) / 2;
        const maskScaleFactorY = item.scale.y / (item.grid.dpi / grid.dpi) / 2;
        const mask = originalImage
            .getChannel(originalImage.components, { keepAlpha: false, mergeAlpha: false })
            .mask({ threshold: 0.9 })
            .resize({
                width: originalImage.width * maskScaleFactorX,
                height: originalImage.height * maskScaleFactorY,
            })
            .invert();

        // Trace it into paths.
        // Options:  https://github.com/tomayac/esm-potrace-wasm  and  https://potrace.sourceforge.net/potracelib.pdf
        const svgCommand = await potrace(mask.getCanvas(), {
            pathonly: true,
            extractcolors: false,
            translate: false,
            opttolerance: 0.05, // Default is 0.2, which breaks circles.
        }) as any as string[]; // The return type is actually string, but the type definition is wrong.

        // Convert the SVG path(s) into a Skia path, and merge them together if it's multiple paths.
        const paths = svgCommand.map(path => this.canvasKit.Path.MakeFromSVGString(path)).filter(path => path) as Path[];
        if (!paths.length) // FIXME: it's a square, so just reveal the whole thing.
            return;
        const path = paths[0];
        for (const p of paths.slice(1))
            path.op(p, this.canvasKit.PathOp.Union);

        // Potrace has the origin at the bottom left instead of the top, so we need to flip the path.
        path.transform(this.canvasKit.Matrix.scaled(1, -1));

        // Fix the size to match the original image.  potracer has a 10-to-1 scale, and we need to undo shrinking the mask
        path.transform(this.canvasKit.Matrix.scaled(0.2, 0.2));

        // Move it so the 0,0 is in the center, which is how OBR does images by default.
        path.transform(this.canvasKit.Matrix.translated(-originalImage.width * maskScaleFactorX, originalImage.height * maskScaleFactorY));

        // Create a new path item from the SVG path.
        OBR.scene.items.addItems([
            buildPath()
                .commands(skiaPathToObrPath(path.toCmds()))
                .position(item.position)
                .rotation(item.rotation)
                .layer('FOG')
                .name('Fog Cutout')
                .fillColor('#222222')
                .strokeWidth(0)
                .visible(false)
                .disableHit(true)
                .metadata({ createdBy: getId('revealToken') })
                .attachedTo(item.id)
                .build(),
        ]);

        // Add metadata to the base image so we can remove the cutout later.
        OBR.scene.items.updateItems([item], ([item]) => {
            revealTokenMetadata.set(item, { revealed: true });
        });
    }
}
