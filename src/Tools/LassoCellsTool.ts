import { Command, PathCommand, Vector2 } from '@owlbear-rodeo/sdk';
import getId from '../Utils/getId';
import { Cell, grid, Point } from '@davidsev/owlbear-utils';
import { BaseTool } from './BaseTool';
import simplify from 'simplify-js';
import { fillGapsInPath } from '../Utils/fillGapsInPath';
import { CanvasKit } from 'canvaskit-wasm';
import { cellInPoly } from '../Utils/cellInPoly';
import { skiaPathToObrPath } from '../Utils/skiaPathToObrPath';

export class LassoCellsTool extends BaseTool {

    readonly id: string = getId('lassoCells');
    readonly icon: string = '/lassoCells.svg';
    readonly label: string = 'Select Area';

    private points: Point[] = [];
    private cells: Map<String, Cell> = new Map();

    constructor (public readonly canvasKit: CanvasKit) {
        super();
    }

    protected add (point: Vector2): void {
        this.points.push(new Point(point));
        const cell = grid.getCell(point);
        if (!this.cells.has(cell.toString()))
            this.cells.set(cell.toString(), cell);
    }

    protected clear () {
        this.points = [];
        this.cells.clear();
    }

    protected getPathCommands (): PathCommand[] {

        if (this.points.length < 3)
            return [];

        // Make a simplified version of the path with less points.
        const simplifiedPoints = simplify([...this.points, this.points[0]], 2, false).map(p => new Point(p));

        // If there are overlaps, then separate them out.  Polyclip can do this, and also guarantees that it's counter clockwise.
        // For each path, only take the outer ring (so fill any holes).
        // We then also add extra points to long lines, so long thin points can't go through a cell without any points hitting.
        const lassoPolys = fillGapsInPath(simplifiedPoints, grid.dpi / 2);

        //  Iterate over all the cells that could be covered by the lasso, and check if they intersect any of the paths.
        const cells: Cell[] = [];
        for (const cell of grid.iterateCellsBoundingPoints([...this.cells.values()])) {
            if (cellInPoly(cell, lassoPolys))
                cells.push(cell);
        }

        // Merge the cells.
        const newShape = new this.canvasKit.Path();
        for (const cell of cells.values()) {
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

    protected getGuidePathCommands (): PathCommand[] | null {
        const commands: PathCommand[] = [];
        for (const [i, point] of this.points.entries())
            commands.push([i ? Command.LINE : Command.MOVE, point.x, point.y]);
        commands.push([Command.CLOSE]);

        return commands;
    }
}

