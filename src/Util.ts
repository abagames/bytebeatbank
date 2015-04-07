module U {
    "use strict";
    export function rand(from: number = 0, to: number = 1): number {
        return Math.random() * (to - from) + from;
    }

    export function randInt(from: number, to: number): number {
        return Math.floor(Math.random() * (to - from + 1) + from);
    }

    export function randSquareInt(from: number, to: number): number {
        return Math.floor(Math.random() * Math.random() * (to - from + 1) + from);
    }

    export function clamp(min: number, max: number, v: number): number {
        if (v < min) {
            return min;
        } else if (v > max) {
            return max;
        } else {
            return v;
        }
    }

    export function loopRange(min: number, max: number, v: number): number {
        var w = max - min;
        var r = v - min;
        if (r >= 0) {
            return r % w + min;
        } else {
            return w + r % w + min;
        }
    }
}
