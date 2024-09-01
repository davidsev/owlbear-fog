import { Command, MoveCommand, PathCommand } from '@owlbear-rodeo/sdk';

export function skiaPathToObrPath (skiaCmds: Float32Array): PathCommand[] {

    const obrCommands: PathCommand[] = [];
    let i = 0;
    while (i < skiaCmds.length) {
        const cmd = skiaCmds[i];
        switch (skiaCmds[i]) {
            case Command.CLOSE:
                obrCommands.push([Command.CLOSE]);
                i++;
                break;
            case Command.MOVE:
            case Command.LINE:
                obrCommands.push([...skiaCmds.subarray(i, i + 3)] as MoveCommand);
                i += 3;
                break;
            case Command.QUAD:
                obrCommands.push([...skiaCmds.subarray(i, i + 5)] as MoveCommand);
                i += 5;
                break;
            case Command.CONIC:
                obrCommands.push([...skiaCmds.subarray(i, i + 6)] as MoveCommand);
                i += 6;
                break;
            case Command.CUBIC:
                obrCommands.push([...skiaCmds.subarray(i, i + 7)] as MoveCommand);
                i += 7;
                break;
            default:
                throw new Error('Unknown skPath command: ' + cmd);
        }
    }

    return obrCommands;
}
