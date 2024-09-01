import { PathCommand, Vector2 } from '@owlbear-rodeo/sdk';
import getId from '../getId';
import { Cell, grid } from '@davidsev/owlbear-utils';
import { BaseTool } from './BaseTool';
import { CanvasKit } from 'canvaskit-wasm';
import { skiaPathToObrPath } from '../skiaPathToObrPath';

export class SelectCellsTool extends BaseTool {

    readonly id: string = getId('highlightCells');
    readonly icon: string = '/selectCells.svg';
    readonly label: string = 'Select Cells';

    private cells: Map<String, Cell> = new Map();

    constructor (public readonly canvasKit: CanvasKit) {
        super();
    }

    protected add (point: Vector2): void {
        const cell = grid.getCell(point);
        if (!this.cells.has(cell.toString()))
            this.cells.set(cell.toString(), cell);
    }

    protected clear () {
        this.cells.clear();
    }

    protected getPathCommands (): PathCommand[] {

        const newShape = new this.canvasKit.Path();
        for (const cell of this.cells.values()) {
            for (const [i, point] of cell.corners.entries()) {
                if (i == 0)
                    newShape.moveTo(point.x, point.y);
                else
                    newShape.lineTo(point.x, point.y);
            }
            newShape.close();
        }

        newShape.simplify();

        return skiaPathToObrPath(newShape.toCmds());
    }
}
