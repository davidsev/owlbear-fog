import { PathCommand, Vector2 } from '@owlbear-rodeo/sdk';
import getId from '../getId';
import { Point } from '@davidsev/owlbear-utils';
import { BaseTool } from './BaseTool';
import { CanvasKit, Path } from 'canvaskit-wasm';
import { skiaPathToObrPath } from '../skiaPathToObrPath';

const radius = 50;

export class BrushTool extends BaseTool {

    readonly id: string = getId('brush');
    readonly icon: string = '/brush.svg';
    readonly label: string = 'Brush';

    private points: Point[] = [];
    private shape: Path;

    constructor (public readonly canvasKit: CanvasKit) {
        super();
        this.shape = new this.canvasKit.Path();
    }

    protected add (point: Vector2): void {
        if (!this.points.length || this.points[this.points.length - 1].distanceTo(new Point(point)) > 10) {
            const prevPoint = this.points[this.points.length - 1] ?? null;
            const newPoint = new Point(point);
            this.points.push(newPoint);

            // Add a circle at the new point for the brush.
            const newShape = new this.canvasKit.Path();
            newShape.addCircle(point.x, point.y, radius);

            // Draw a line from the last point to the new one, to make the edge less blobby.
            if (prevPoint) {
                const length = prevPoint.distanceTo(newPoint);
                const normal = newPoint.sub(prevPoint).div(length).mult(radius);
                const tangent = new Point(-normal.y, normal.x);
                const topLeft = prevPoint.add(tangent);
                const topRight = prevPoint.sub(tangent);
                const bottomRight = newPoint.sub(tangent);
                const bottomLeft = newPoint.add(tangent);
                newShape.moveTo(topLeft.x, topLeft.y);
                newShape.lineTo(topRight.x, topRight.y);
                newShape.lineTo(bottomRight.x, bottomRight.y);
                newShape.lineTo(bottomLeft.x, bottomLeft.y);
                newShape.close();
            }
            this.shape.op(newShape, this.canvasKit.PathOp.Union);
        }
    }

    protected clear () {
        this.points = [];
        this.shape = new this.canvasKit.Path();
    }

    protected getPathCommands (): PathCommand[] {
        if (this.points.length < 2)
            return [];

        return skiaPathToObrPath(this.shape.toCmds());
    }
}
