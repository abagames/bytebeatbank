/// <reference path="../Scripts/typings/knockout/knockout.d.ts" />

class Expression {
    static opStrs = ['|', '&', '+', '-', '*', '/', '%', '^', '<<', '>>'];
    connectionOp: number;
    op: number;
    factor: number;
    connectionOpStr: KnockoutObservable<string> = ko.observable<string>('');
    timeOpStr: KnockoutObservable<string> = ko.observable<string>('');

    createRandom() {
        if (U.rand() < 0.8) {
            this.connectionOp = U.randInt(0, 1);
        } else {
            this.connectionOp = U.randInt(2, 9);
        }
        if (U.rand() < 0.5) {
            if (U.rand() < 0.66) {
                this.op = 8;
                this.factor = U.randInt(1, 4);
            } else {
                this.op = 4;
                this.factor = U.randSquareInt(2, 16);
            }
        } else {
            if (U.rand() < 0.66) {
                this.op = 9;
                this.factor = U.randInt(1, 4);
            } else {
                this.op = 5;
                this.factor = U.randSquareInt(2, 256);
            }
        }
        this.setView();
    }

    setView() {
        this.connectionOpStr(Expression.opStrs[this.connectionOp]);
        this.timeOpStr('T' + Expression.opStrs[this.op] + '' + this.factor);
    }

    calc(t: number, prevNum: number = null) {
        var n = this.calcOp(t, this.op, this.factor);
        if (prevNum) {
            return this.calcOp(prevNum, this.connectionOp, n);
        } else {
            return n;
        }
    }

    calcOp(a: number, op: number, b: number) {
        switch (op) {
            case 0:
                return a | b;
            case 1:
                return a & b;
            case 2:
                return a + b;
            case 3:
                return a - b;
            case 4:
                return a * b;
            case 5:
                return a / b;
            case 6:
                return a % b;
            case 7:
                return a ^ b;
            case 8:
                return a << b;
            case 9:
                return a >> b;
        }
    }

    getJson() {
        return {
            c: this.connectionOp,
            o: this.op,
            f: this.factor
        };
    }

    setFromJson(json) {
        this.connectionOp = json.c;
        this.op = json.o;
        this.factor = json.f;
        this.setView();
    }
}
