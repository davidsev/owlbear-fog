import CanvasKitInit, { CanvasKit } from 'canvaskit-wasm';

let canvasKit: CanvasKit | null = null;
const promises: ((canvasKit: CanvasKit) => any)[] = [];

/** Convenience function to await the loading of the canvaskit library.
 *  CanvasKit has a wonky loading method that can only be accessed once, so this is a way to make it
 *  globally accessible while still ensuring it's loaded before use.
 */
export async function awaitCanvasKit (): Promise<CanvasKit> {
    if (canvasKit)
        return canvasKit;
    else
        return new Promise((resolve) => {
            promises.push(resolve);
        });
}

// Load the library, save it, and resolve all promises.
CanvasKitInit().then(async (ck) => {
    canvasKit = ck;
    for (const resolve of promises)
        resolve(ck);
});
