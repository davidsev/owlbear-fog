import OBR, { buildPath, Image, Path as ObrPath } from '@owlbear-rodeo/sdk';
import { Image as ImageJs } from 'image-js';
import { grid } from '@davidsev/owlbear-utils';
import { potrace } from 'esm-potrace-wasm';
import { Path as CanvasKitPath } from 'canvaskit-wasm';
import { skiaPathToObrPath } from './skiaPathToObrPath';
import getId from './getId';
import { awaitCanvasKit } from './awaitCanvasKit';

export class RevealedImage {
    private fogCutout?: ObrPath;

    constructor (public readonly item: Image) {}

    public get revealed (): boolean {
        return !!this.fogCutout;
    }

    public set revealed (value: boolean) {
        if (value)
            this.reveal();
        else
            this.unreveal();
    }

    private async reveal (): Promise<void> {

        // If we are already revealed, then do nothing.
        if (this.fogCutout)
            return;

        const canvasKit = await awaitCanvasKit();

        // Load the image and pull out just the alpha channel.
        // FIXME: If no alpha channel, then it's square and we can just reveal the whole thing.
        const originalImage = await ImageJs.load(this.item.image.url);
        if (!originalImage.alpha)
            return;

        // Turn the alpha channel into a 1-bit mask.  Split it at 80% opacity, we don't want to reveal any bits that
        //   are too see-through (eg shadows and halos) but we also dont want to remove bits that look solid.
        //   This feels like an ok-ish compromise.
        // We also shrink the mask so the path doesn't have too many points.  This comes out to 75 px per cell.
        const maskScaleFactorX = this.item.scale.x / (this.item.grid.dpi / grid.dpi) / 2;
        const maskScaleFactorY = this.item.scale.y / (this.item.grid.dpi / grid.dpi) / 2;
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
        const paths = svgCommand.map(path => canvasKit.Path.MakeFromSVGString(path)).filter(path => path) as CanvasKitPath[];
        if (!paths.length) // FIXME: it's a square, so just reveal the whole thing.
            return;
        const path = paths[0];
        for (const p of paths.slice(1))
            path.op(p, canvasKit.PathOp.Union);

        // Potrace has the origin at the bottom left instead of the top, so we need to flip the path.
        path.transform(canvasKit.Matrix.scaled(1, -1));

        // Fix the size to match the original image.  potracer has a 10-to-1 scale, and we need to undo shrinking the mask
        path.transform(canvasKit.Matrix.scaled(0.2, 0.2));

        // Move it so the 0,0 is in the center, which is how OBR does images by default.
        path.transform(canvasKit.Matrix.translated(-originalImage.width * maskScaleFactorX, originalImage.height * maskScaleFactorY));

        // If the image is moved via "Align Image", then we need to move the path as well.
        path.transform(canvasKit.Matrix.translated(-(this.item.grid.offset.x - (this.item.image.width / 2)) / (this.item.grid.dpi / grid.dpi), -(this.item.grid.offset.y - (this.item.image.height / 2)) / (this.item.grid.dpi / grid.dpi)));

        // Create a new path item from the SVG path.
        this.fogCutout = buildPath()
            .commands(skiaPathToObrPath(path.toCmds()))
            .position(this.item.position)
            .rotation(this.item.rotation)
            .layer('FOG')
            .name('Fog Cutout')
            .fillColor('#222222')
            .strokeWidth(0)
            .visible(false)
            .disableHit(true)
            .metadata({ createdBy: getId('revealToken') })
            .attachedTo(this.item.id)
            .build();
        OBR.scene.local.addItems([this.fogCutout]);
    }

    private async unreveal (): Promise<void> {

        // If we aren't revealed, then do nothing.
        if (!this.fogCutout)
            return;

        await OBR.scene.local.deleteItems([this.fogCutout.id]);
        this.fogCutout = undefined;
    }
}
