/// <reference path="../Scripts/typings/webaudioapi/waa.d.ts" />

class AudioPlayer {
    static sampleRate = 44100;
    static streamLength = 4096;
    context: AudioContext;
    tracks: {
        node: ScriptProcessorNode;
        beat: ByteBeat;
    }[];
    gain: GainNode;
    compressor: DynamicsCompressorNode;
    isReady = false;
    isPlaying = false;

    constructor(nodeNum: number = 5) {
        var win: any = window;
        var winAudioContext = win.AudioContext || win.webkitAudioContext;
        if (!winAudioContext) {
            return;
        }
        this.isReady = true;
        this.context = new winAudioContext();
        AudioPlayer.sampleRate = this.context.sampleRate;
        this.context.createGain = this.context.createGain || (<any>this.context).createGainNode;
        this.gain = this.context.createGain();
        this.gain.gain.value = 0.1;
        this.compressor = this.context.createDynamicsCompressor();
        this.tracks = _.times(nodeNum,(i) => {
            var node =
                this.context.createScriptProcessor(AudioPlayer.streamLength, 1, 1);
            var beat = new ByteBeat();
            node.onaudioprocess = (event) => {
                var data: Float32Array = event.outputBuffer.getChannelData(0);
                var stream = beat.getStream();
                data.set(stream);
            };
            return { node: node, beat: beat };
        });
    }

    setVolume(volume: number) {
        if (!this.isReady) {
            return;
        }
        this.gain.gain.value = volume;
    }

    setExpressions(index: number, expressions: Expression[]) {
        if (!this.isReady) {
            return;
        }
        this.tracks[index].beat.setExpressions(expressions);
    }

    getByteBeat(index: number) {
        if (!this.isReady) {
            return null;
        }
        return this.tracks[index].beat;
    }

    play() {
        if (this.isPlaying || !this.isReady) {
            return;
        }
        _.forEach(this.tracks,(t) => {
            t.beat.resetTime();
            t.node.connect(this.gain);
        });
        this.gain.connect(this.compressor);
        this.compressor.connect(this.context.destination);
        this.isPlaying = true;
    }

    stop() {
        if (!this.isPlaying || !this.isReady) {
            return;
        }
        this.gain.disconnect();
        _.forEach(this.tracks,(t) => {
            t.node.disconnect();
        });
        this.isPlaying = false;
    }
}
 