import { Point } from '@davidsev/owlbear-utils';

export function fillGapsInPath (points: Point[], maxDistance: number): Point[] {
    if (points.length <= 1) {
        return points;
    }

    let lastPoint = points[0];
    const ret: Point[] = [lastPoint];
    for (let i = 1; i < points.length; i++) {
        const nextPoint = points[i];
        const distance = lastPoint.distanceTo(nextPoint);
        const steps = Math.ceil(distance / maxDistance);
        const stepVector = nextPoint.sub(lastPoint).div(steps);
        for (let step = 1; step < steps; step++) {
            ret.push(lastPoint.add(stepVector.mult(step)));
        }
        ret.push(nextPoint);
        lastPoint = nextPoint;
    }

    return ret;
}
