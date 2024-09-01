import { Cell, Point } from '@davidsev/owlbear-utils';

// Taken from https://wrfranklin.org/Research/Short_Notes/pnpoly.html
export function pointInPoly (test: Point, points: Point[]): boolean {
    let inPoly = false;

    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        if (((points[i].y > test.y) != (points[j].y > test.y)) &&
            (test.x < (points[j].x - points[i].x) * (test.y - points[i].y) / (points[j].y - points[i].y) + points[i].x))
            inPoly = !inPoly;
    }

    return inPoly;
}

export function cellInPoly (test: Cell, points: Point[]): boolean {
    // Check if any corner of the cell is in the poly
    for (const corner of test.corners) {
        if (pointInPoly(corner, points)) {
            return true;
        }
    }

    // Check if any point of the poly is in the cell
    for (const point of points) {
        if (test.containsPoint(point)) {
            return true;
        }
    }

    // In theory a very long thin spike could go through a cell, do a 180, and come back without hitting any points.
    // The provided points should be fed through fillGapsInPath to prevent this, so we don't need to check for it here.

    return false;
}

export function cellInPolys (test: Cell, points: Point[][]): boolean {
    for (const poly of points) {
        if (cellInPoly(test, poly)) {
            return true;
        }
    }
    return false;
}
