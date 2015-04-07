class ByteBeatCanvas {
    context: CanvasRenderingContext2D;
    bytes: Float32Array;
    bytesIndex = 0;
    maxHeight = 128;

    constructor(public canvas: HTMLCanvasElement, public byteBeat: ByteBeat) {
        this.context = this.canvas.getContext('2d');
        this.bytes = new Float32Array(this.maxHeight);
    }

    clear() {
        for (var i = 0; i < this.maxHeight; i++) {
            this.bytes[i] = 0;
        }
    }

    update() {
        if (!this.byteBeat) {
            return;
        }
        var width = this.canvas.width;
        var height = this.canvas.height;
        if (height > this.maxHeight) {
            height = this.maxHeight;
        }
        this.context.clearRect(0, 0, width, height);
        this.bytes[this.bytesIndex] = this.byteBeat.lastValue;
        this.bytesIndex = U.loopRange(0, this.maxHeight, this.bytesIndex + 1);
        var bi = this.bytesIndex;
        for (var y = 0; y < height; y++) {
            bi = U.loopRange(0, this.maxHeight, bi - 1);
            var b = this.bytes[bi];
            var xs = 1;
             if (b < 0) {
                xs = -1;
                b = -b;
            }
            this.context.fillStyle =
                'rgba(50, ' + (150 + xs * 50) + ', 250, ' + (1 - y / height) + ')';
            var x = width / 2;
            var w = width / 2 * b;
            if (xs == -1) {
                x -= w;
            }
            this.context.fillRect(x, y, w, 1);
        }
    }
}
