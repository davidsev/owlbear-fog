import OBR, { buildPath, isPath, Metadata, Path, PathCommand, ToolIcon, ToolMode, Vector2 } from '@owlbear-rodeo/sdk';
import { ToolContext, ToolEvent } from '@owlbear-rodeo/sdk/lib/types/Tool';
import { grid } from '@davidsev/owlbear-utils';

export abstract class BaseTool implements ToolMode {

    abstract readonly label: string;
    abstract readonly icon: string;
    abstract readonly id: string;

    private path: Path | null = null;
    private guidePath: Path | null = null;

    protected abstract add (point: Vector2): void;

    protected abstract getPathCommands (): PathCommand[];

    protected getGuidePathCommands (): null | PathCommand[] {
        return null;
    }

    protected abstract clear (): void;

    /** The icon that will be displayed in the toolbar. */
    get icons (): ToolIcon[] {
        return [{
            icon: URL_PREFIX + this.icon,
            label: this.label,
            filter: {
                activeTools: ['rodeo.owlbear.tool/fog'],
            },
        }];
    }

    async onToolDragStart (context: ToolContext, event: ToolEvent) {
        this.cleanup();
        this.addPoint(event.pointerPosition);
        this.addPath();
        this.addGuidePath();
    }

    async onToolDragMove (context: ToolContext, event: ToolEvent) {
        this.addPoint(event.pointerPosition);
    }

    async onToolDragEnd (context: ToolContext, event: ToolEvent) {
        await this.save(context.metadata);
        this.cleanup();
    }

    async onToolDragCancel () {
        this.cleanup();
    }

    private addPoint (point: Vector2): void {
        this.add(point);
        if (this.path) {
            OBR.scene.local.updateItems([this.path.id], ([path]) => {
                if (isPath(path))
                    path.commands = this.getPathCommands();
            });
        }
        if (this.guidePath) {
            OBR.scene.local.updateItems([this.guidePath.id], ([path]) => {
                if (isPath(path))
                    path.commands = this.getGuidePathCommands() ?? [];
            });
        }
    }

    private cleanup (): void {
        this.clear();
        if (this.path) {
            OBR.scene.local.deleteItems([this.path.id]);
            this.path = null;
        }
        if (this.guidePath) {
            OBR.scene.local.deleteItems([this.guidePath.id]);
            this.guidePath = null;
        }
    }

    private async addPath (): Promise<void> {
        // Get the grid colour to use for the highlight.
        const colour = {
            'LIGHT': '#FFFFFF',
            'DARK': '#000000',
            'HIGHLIGHT': '#FA6400',
        }[grid.style.lineColor];

        this.path = buildPath()
            .strokeColor(colour)
            .position({ x: 0, y: 0 })
            .locked(true)
            .fillOpacity(0)
            .strokeWidth(3)
            .disableHit(true)
            .layer('POPOVER')
            .commands(this.getPathCommands())
            .build();

        await OBR.scene.local.addItems([this.path]);
    }

    private async addGuidePath (): Promise<void> {

        const commands = this.getGuidePathCommands();
        if (!commands)
            return;

        // Get the grid colour to use for the highlight.
        const colour = {
            'LIGHT': '#FFFFFF',
            'DARK': '#000000',
            'HIGHLIGHT': '#FA6400',
        }[grid.style.lineColor];

        this.guidePath = buildPath()
            .strokeColor(colour)
            .position({ x: 0, y: 0 })
            .locked(true)
            .fillOpacity(0)
            .strokeWidth(2)
            .disableHit(true)
            .layer('POPOVER')
            .commands(commands)
            .build();

        await OBR.scene.local.addItems([this.guidePath]);
    }

    private async save (fogMetadata: Metadata): Promise<void> {
        const cut = !!fogMetadata?.cut;

        await OBR.scene.items.addItems([buildPath()
            .position({ x: 0, y: 0 })
            .layer('FOG')
            .name('Fog Path')
            .fillColor('#222222')
            .strokeColor('#222222')
            .visible(!cut)
            .commands(this.getPathCommands())
            .build(),
        ]);
    }
}
