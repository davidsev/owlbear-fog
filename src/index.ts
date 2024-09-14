import { registerInitFunction } from './init';
import OBR from '@owlbear-rodeo/sdk';
import { BrushTool } from './Tools/BrushTool';
import CanvasKitInit from 'canvaskit-wasm';
import { SelectCellsTool } from './Tools/SelectCellsTool';
import { LassoCellsTool } from './Tools/LassoCellsTool';
import { BrushSizeForm } from './UI/Components/BrushSizeForm';
import styles from './UI/baseCSS.css';
import './UI';
import { init as initPotrace } from 'esm-potrace-wasm';
import { RevealToken } from './ContextMenu/RevealToken';
import { UnrevealToken } from './ContextMenu/UnrevealToken';

registerInitFunction('background', () => {
    initPotrace(); // Don't bother to wait, we just assume it'll load faster than you can click the button.
    CanvasKitInit().then(async (canvasKit) => {
        OBR.tool.createMode(new SelectCellsTool(canvasKit));
        OBR.tool.createMode(new LassoCellsTool(canvasKit));
        OBR.tool.createMode(new BrushTool(canvasKit));
        OBR.contextMenu.create(new RevealToken(canvasKit));
        OBR.contextMenu.create(new UnrevealToken());
    });
});

registerInitFunction('brush-settings', () => {
    document.body.appendChild(new BrushSizeForm());

    const styleSheet = document.createElement('style');
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
});
