import { registerInitFunction } from './init';
import OBR from '@owlbear-rodeo/sdk';
import { BrushTool } from './Tools/BrushTool';
import CanvasKitInit from 'canvaskit-wasm';
import { SelectCellsTool } from './Tools/SelectCellsTool';
import { LassoCellsTool } from './Tools/LassoCellsTool';
import { BrushSizeForm } from './UI/Components/BrushSizeForm';
import styles from './UI/baseCSS.css';
import './UI';

registerInitFunction('background', () => {
    CanvasKitInit().then(async (canvasKit) => {
        OBR.tool.createMode(new SelectCellsTool(canvasKit));
        OBR.tool.createMode(new LassoCellsTool(canvasKit));
        OBR.tool.createMode(new BrushTool(canvasKit));
    });
});

registerInitFunction('brush-settings', () => {
    document.body.appendChild(new BrushSizeForm());

    const styleSheet = document.createElement('style');
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
});
