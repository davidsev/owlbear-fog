import OBR, { PathCommand, Vector2 } from '@owlbear-rodeo/sdk';
import getId from '../getId';
import { grid, Point } from '@davidsev/owlbear-utils';
import { BaseTool } from './BaseTool';
import { CanvasKit, Path } from 'canvaskit-wasm';
import { skiaPathToObrPath } from '../skiaPathToObrPath';
import { ToolContext, ToolEvent } from '@owlbear-rodeo/sdk/lib/types/Tool';
import { toolMetadata } from '../Metadata/ToolMetadata';

export class BrushTool extends BaseTool {

    readonly id: string = getId('brush');
    readonly icon: string = '/brush.svg';
    readonly label: string = 'Brush';

    private points: Point[] = [];
    private shape: Path;
    private radius: number = 0.25;

    // There's an OBR bug where opening a popover in onActivate causes the tool to deactivate, which makes a loop.
    // This flag is used to detect and break the loop.
    private inActivationFunction: boolean = false;

    constructor (public readonly canvasKit: CanvasKit) {
        super();
        this.shape = new this.canvasKit.Path();
    }

    public async onActivate (): Promise<void> {

        // If we're already in the activation function, abort.
        if (this.inActivationFunction) {
            console.log('Skipping extra activation event');
            return;
        }
        this.inActivationFunction = true;

        await OBR.popover.open({
            id: getId('brush-settings'),
            url: URL_PREFIX + '/frame.html#brush-settings',
            height: 40,
            width: 250,
            disableClickAway: true,
            anchorElementId: getId('brush'),
            anchorOrigin: {
                horizontal: 'CENTER',
                vertical: 'TOP',
            },
            marginThreshold: 56,
            anchorReference: 'ELEMENT',
        });

        this.inActivationFunction = false;
    }

    public onDeactivate (): void {
        if (this.inActivationFunction) {
            console.log('Skipping extra deactivation event');
            return;
        }
        OBR.popover.close(getId('brush-settings'));
    }

    async onToolDragStart (context: ToolContext, event: ToolEvent): Promise<void> {
        this.radius = (await toolMetadata.get()).radius * grid.dpi;
        super.onToolDragStart(context, event);
    }

    protected add (point: Vector2): void {
        if (!this.points.length || this.points[this.points.length - 1].distanceTo(new Point(point)) > 10) {
            const prevPoint = this.points[this.points.length - 1] ?? null;
            const newPoint = new Point(point);
            this.points.push(newPoint);

            // Add a circle at the new point for the brush.
            const newShape = new this.canvasKit.Path();
            newShape.addCircle(point.x, point.y, this.radius);

            // Draw a line from the last point to the new one, to make the edge less blobby.
            if (prevPoint) {
                const length = prevPoint.distanceTo(newPoint);
                const normal = newPoint.sub(prevPoint).div(length).mult(this.radius);
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
