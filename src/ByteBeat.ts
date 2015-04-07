/// <reference path="../Scripts/typings/lodash/lodash.d.ts" />

class ByteBeat {
    expressions: Expression[] = null;
    newExpressions: Expression[] = null;
    hasNextExpressions = false;
    stream: Float32Array;
    timeRatio: number;
    t = 0;
    lastValue = 0;

    constructor() {
        this.stream = new Float32Array(AudioPlayer.streamLength);
        this.timeRatio = 7200 / AudioPlayer.sampleRate;
    }

    setExpressions(expressions: Expression[]) {
        this.newExpressions = expressions;
        this.hasNextExpressions = true;
    }

    resetTime() {
        this.t = 0;
    }

    getStream(): Float32Array {
        for (var i = 0; i < AudioPlayer.streamLength; i++) {
            this.stream[i] = this.calc(this.t);
            this.t++;
        }
        this.lastValue = this.stream[AudioPlayer.streamLength - 1];
        if (this.hasNextExpressions) {
            this.expressions = this.newExpressions;
            this.hasNextExpressions = false;
        }
        return this.stream;
    }

    calc(t): number {
        var time = t * this.timeRatio;
        if (!this.expressions) {
            return 0;
        }
        var prevNum: number = null;
        var el = this.expressions.length;
        for (var i = 0; i < el; i++) {
            prevNum = this.expressions[i].calc(time, prevNum);
        }
        return this.convert(prevNum);
    }

    convert(bv: number) {
        var f = bv & 128;
        var v = bv & 127;
        if (f === 0) {
            return v / 128;
        } else {
            return (v - 128) / 128;
        }
    }

    createRandomExpressions() {
        var count = 3 - U.randSquareInt(0, 2);
        for (var i = 0; i < 7; i++) {
            this.expressions = _.times(count,() => {
                var e = new Expression();
                e.createRandom();
                return e;
            });
            var pc = this.countPeaks();
            if (pc > 20 && pc < 40) {
                break;
            }
        }
        return this.expressions;
    }

    countPeaks() {
        var pc = 0;
        var threshold = 0.9;
        var otc = 0;
        for (var i = 0; i < 100000; i++) {
            var v = this.calc(i);
            if (Math.abs(v) > threshold) {
                otc++;
                if (otc > 10) {
                    pc++;
                    i += 1000;
                    otc = 0;
                }
            } else {
                otc = 0;
            }
        }
        return pc;
    }
}
 