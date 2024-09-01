import { registerInitFunction } from './init';
import OBR from '@owlbear-rodeo/sdk';
import { BrushTool } from './Tools/BrushTool';
import CanvasKitInit from 'canvaskit-wasm';
import { SelectCellsTool } from './Tools/SelectCellsTool';
import { LassoCellsTool } from './Tools/LassoCellsTool';

registerInitFunction('background', () => {

    CanvasKitInit().then((canvasKit) => {
        OBR.tool.createMode(new SelectCellsTool(canvasKit));
        OBR.tool.createMode(new LassoCellsTool(canvasKit));
        OBR.tool.createMode(new BrushTool(canvasKit));
    });

});
