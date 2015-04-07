/// <reference path="../Scripts/typings/webaudioapi/waa.d.ts" />
var AudioPlayer = (function () {
    function AudioPlayer(nodeNum) {
        var _this = this;
        if (nodeNum === void 0) { nodeNum = 5; }
        this.isReady = false;
        this.isPlaying = false;
        var win = window;
        var winAudioContext = win.AudioContext || win.webkitAudioContext;
        if (!winAudioContext) {
            return;
        }
        this.isReady = true;
        this.context = new winAudioContext();
        AudioPlayer.sampleRate = this.context.sampleRate;
        this.context.createGain = this.context.createGain || this.context.createGainNode;
        this.gain = this.context.createGain();
        this.gain.gain.value = 0.1;
        this.compressor = this.context.createDynamicsCompressor();
        this.tracks = _.times(nodeNum, function (i) {
            var node = _this.context.createScriptProcessor(AudioPlayer.streamLength, 1, 1);
            var beat = new ByteBeat();
            node.onaudioprocess = function (event) {
                var data = event.outputBuffer.getChannelData(0);
                var stream = beat.getStream();
                data.set(stream);
            };
            return { node: node, beat: beat };
        });
    }
    AudioPlayer.prototype.setVolume = function (volume) {
        if (!this.isReady) {
            return;
        }
        this.gain.gain.value = volume;
    };
    AudioPlayer.prototype.setExpressions = function (index, expressions) {
        if (!this.isReady) {
            return;
        }
        this.tracks[index].beat.setExpressions(expressions);
    };
    AudioPlayer.prototype.getByteBeat = function (index) {
        if (!this.isReady) {
            return null;
        }
        return this.tracks[index].beat;
    };
    AudioPlayer.prototype.play = function () {
        var _this = this;
        if (this.isPlaying || !this.isReady) {
            return;
        }
        _.forEach(this.tracks, function (t) {
            t.beat.resetTime();
            t.node.connect(_this.gain);
        });
        this.gain.connect(this.compressor);
        this.compressor.connect(this.context.destination);
        this.isPlaying = true;
    };
    AudioPlayer.prototype.stop = function () {
        if (!this.isPlaying || !this.isReady) {
            return;
        }
        this.gain.disconnect();
        _.forEach(this.tracks, function (t) {
            t.node.disconnect();
        });
        this.isPlaying = false;
    };
    AudioPlayer.sampleRate = 44100;
    AudioPlayer.streamLength = 4096;
    return AudioPlayer;
})();
/// <reference path="../Scripts/typings/lodash/lodash.d.ts" />
var ByteBeat = (function () {
    function ByteBeat() {
        this.expressions = null;
        this.newExpressions = null;
        this.hasNextExpressions = false;
        this.t = 0;
        this.lastValue = 0;
        this.stream = new Float32Array(AudioPlayer.streamLength);
        this.timeRatio = 7200 / AudioPlayer.sampleRate;
    }
    ByteBeat.prototype.setExpressions = function (expressions) {
        this.newExpressions = expressions;
        this.hasNextExpressions = true;
    };
    ByteBeat.prototype.resetTime = function () {
        this.t = 0;
    };
    ByteBeat.prototype.getStream = function () {
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
    };
    ByteBeat.prototype.calc = function (t) {
        var time = t * this.timeRatio;
        if (!this.expressions) {
            return 0;
        }
        var prevNum = null;
        var el = this.expressions.length;
        for (var i = 0; i < el; i++) {
            prevNum = this.expressions[i].calc(time, prevNum);
        }
        return this.convert(prevNum);
    };
    ByteBeat.prototype.convert = function (bv) {
        var f = bv & 128;
        var v = bv & 127;
        if (f === 0) {
            return v / 128;
        }
        else {
            return (v - 128) / 128;
        }
    };
    ByteBeat.prototype.createRandomExpressions = function () {
        var count = 3 - U.randSquareInt(0, 2);
        for (var i = 0; i < 7; i++) {
            this.expressions = _.times(count, function () {
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
    };
    ByteBeat.prototype.countPeaks = function () {
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
            }
            else {
                otc = 0;
            }
        }
        return pc;
    };
    return ByteBeat;
})();
var ByteBeatCanvas = (function () {
    function ByteBeatCanvas(canvas, byteBeat) {
        this.canvas = canvas;
        this.byteBeat = byteBeat;
        this.bytesIndex = 0;
        this.maxHeight = 128;
        this.context = this.canvas.getContext('2d');
        this.bytes = new Float32Array(this.maxHeight);
    }
    ByteBeatCanvas.prototype.clear = function () {
        for (var i = 0; i < this.maxHeight; i++) {
            this.bytes[i] = 0;
        }
    };
    ByteBeatCanvas.prototype.update = function () {
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
            this.context.fillStyle = 'rgba(50, ' + (150 + xs * 50) + ', 250, ' + (1 - y / height) + ')';
            var x = width / 2;
            var w = width / 2 * b;
            if (xs == -1) {
                x -= w;
            }
            this.context.fillRect(x, y, w, 1);
        }
    };
    return ByteBeatCanvas;
})();
/// <reference path="../Scripts/typings/knockout/knockout.d.ts" />
/// <reference path="../Scripts/typings/lodash/lodash.d.ts" />
var Card = (function () {
    function Card() {
        this.expressions = ko.observableArray([]);
        this.isPlaying = ko.observable(false);
        this.byteBeat = audioPlayer.getByteBeat(0);
        var byteBeat = new ByteBeat();
        var es = byteBeat.createRandomExpressions();
        this.expressions(es);
    }
    Card.prototype.play = function () {
        if (this.isPlaying()) {
            return;
        }
        audioPlayer.setExpressions(0, this.expressions());
        this.byteBeatCanvas.clear();
        this.isPlaying(true);
    };
    Card.prototype.stop = function () {
        if (!this.isPlaying()) {
            return;
        }
        audioPlayer.setExpressions(0, null);
        this.isPlaying(false);
    };
    Card.prototype.getJson = function () {
        return _.map(this.expressions(), function (e) { return e.getJson(); });
    };
    Card.prototype.setFromJson = function (json) {
        this.expressions(_.map(json, function (ej) {
            var e = new Expression();
            e.setFromJson(ej);
            return e;
        }));
    };
    return Card;
})();
/// <reference path="../Scripts/typings/knockout/knockout.d.ts" />
var Expression = (function () {
    function Expression() {
        this.connectionOpStr = ko.observable('');
        this.timeOpStr = ko.observable('');
    }
    Expression.prototype.createRandom = function () {
        if (U.rand() < 0.8) {
            this.connectionOp = U.randInt(0, 1);
        }
        else {
            this.connectionOp = U.randInt(2, 9);
        }
        if (U.rand() < 0.5) {
            if (U.rand() < 0.66) {
                this.op = 8;
                this.factor = U.randInt(1, 4);
            }
            else {
                this.op = 4;
                this.factor = U.randSquareInt(2, 16);
            }
        }
        else {
            if (U.rand() < 0.66) {
                this.op = 9;
                this.factor = U.randInt(1, 4);
            }
            else {
                this.op = 5;
                this.factor = U.randSquareInt(2, 256);
            }
        }
        this.setView();
    };
    Expression.prototype.setView = function () {
        this.connectionOpStr(Expression.opStrs[this.connectionOp]);
        this.timeOpStr('T' + Expression.opStrs[this.op] + '' + this.factor);
    };
    Expression.prototype.calc = function (t, prevNum) {
        if (prevNum === void 0) { prevNum = null; }
        var n = this.calcOp(t, this.op, this.factor);
        if (prevNum) {
            return this.calcOp(prevNum, this.connectionOp, n);
        }
        else {
            return n;
        }
    };
    Expression.prototype.calcOp = function (a, op, b) {
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
    };
    Expression.prototype.getJson = function () {
        return {
            c: this.connectionOp,
            o: this.op,
            f: this.factor
        };
    };
    Expression.prototype.setFromJson = function (json) {
        this.connectionOp = json.c;
        this.op = json.o;
        this.factor = json.f;
        this.setView();
    };
    Expression.opStrs = ['|', '&', '+', '-', '*', '/', '%', '^', '<<', '>>'];
    return Expression;
})();
/// <reference path="../Scripts/typings/knockout/knockout.d.ts" />
/// <reference path="../Scripts/typings/lodash/lodash.d.ts" />
var Lane = (function () {
    function Lane(index, viewModel) {
        var _this = this;
        this.index = index;
        this.viewModel = viewModel;
        this.placedCards = ko.observableArray([]);
        this.hasRoom = ko.computed(function () {
            return _this.placedCards().length < 4;
        });
        this.isTrashBin = ko.observable(false);
        this.tipsMsg = ko.observable('');
        this.isTrashBin(index === 0);
        if (!this.isTrashBin()) {
            this.byteBeat = audioPlayer.getByteBeat(index);
        }
        this.onaftermove = this.onaftermove.bind(this);
    }
    Lane.prototype.showTips = function () {
        var _this = this;
        setTimeout(function () {
            _this.tipsMsg('drag and drop the cards here');
        }, this.index * 300);
        setTimeout(function () {
            _this.tipsMsg('');
        }, 5000 + this.index * 300);
    };
    Lane.prototype.onaftermove = function (arg) {
        var card = arg.item;
        card.stop();
        if (this.viewModel.isPlayingAllLanes()) {
            this.viewModel.playAllLanes();
        }
        else {
            this.viewModel.stopAllLanes();
            if (!this.isTrashBin()) {
                this.play();
            }
        }
        this.viewModel.checkAddingCard();
        this.viewModel.createUrl();
        if (this.isTrashBin()) {
            this.placedCards.remove(card);
        }
    };
    Lane.prototype.play = function () {
        var expressions = [];
        _.forEach(this.placedCards(), function (c) {
            _.forEach(c.expressions(), function (e) {
                expressions.push(e);
            });
        });
        audioPlayer.setExpressions(this.index, expressions);
    };
    Lane.prototype.stop = function () {
        if (this.viewModel.isPlayingAllLanes()) {
            return;
        }
        audioPlayer.setExpressions(this.index, null);
    };
    Lane.prototype.clear = function () {
        this.placedCards([]);
        audioPlayer.setExpressions(this.index, null);
    };
    Lane.prototype.getJson = function () {
        return _.map(this.placedCards(), function (c) { return c.getJson(); });
    };
    Lane.prototype.setFromJson = function (json) {
        this.placedCards(_.map(json, function (cj) {
            var c = new Card();
            c.setFromJson(cj);
            return c;
        }));
    };
    return Lane;
})();
var U;
(function (U) {
    "use strict";
    function rand(from, to) {
        if (from === void 0) { from = 0; }
        if (to === void 0) { to = 1; }
        return Math.random() * (to - from) + from;
    }
    U.rand = rand;
    function randInt(from, to) {
        return Math.floor(Math.random() * (to - from + 1) + from);
    }
    U.randInt = randInt;
    function randSquareInt(from, to) {
        return Math.floor(Math.random() * Math.random() * (to - from + 1) + from);
    }
    U.randSquareInt = randSquareInt;
    function clamp(min, max, v) {
        if (v < min) {
            return min;
        }
        else if (v > max) {
            return max;
        }
        else {
            return v;
        }
    }
    U.clamp = clamp;
    function loopRange(min, max, v) {
        var w = max - min;
        var r = v - min;
        if (r >= 0) {
            return r % w + min;
        }
        else {
            return w + r % w + min;
        }
    }
    U.loopRange = loopRange;
})(U || (U = {}));
/// <reference path="../Scripts/typings/lodash/lodash.d.ts" />
/// <reference path="../Scripts/typings/knockout/knockout.d.ts" />
var ViewModel = (function () {
    function ViewModel() {
        var _this = this;
        this.volume = ko.observable(10);
        this.cards = ko.observableArray([]);
        this.lanes = ko.observableArray([]);
        this.isPlayingAllLanes = ko.observable(true);
        this.isReady = ko.observable(false);
        this.isShowingTips = false;
        this.version = '1';
        this.cards(_.times(5, function (i) {
            return new Card();
        }));
        this.lanes(_.times(5, function (i) {
            return new Lane(i, _this);
        }));
        this.showTips = this.showTips.bind(this);
    }
    ViewModel.prototype.onAfterCardAdd = function (element, index, data) {
        $(element).animate({ left: '100px' }, { duration: 0 }).animate({ left: '0' }, { duration: 500 });
    };
    ViewModel.prototype.showTips = function (element, data) {
        if (!this.isShowingTips) {
            return;
        }
        var lane = data;
        if (lane.index >= 1) {
            lane.showTips();
        }
    };
    ViewModel.prototype.checkAddingCard = function () {
        while (this.cards().length < 5) {
            this.cards.push(new Card());
        }
    };
    ViewModel.prototype.playAllLanes = function () {
        this.isPlayingAllLanes(true);
        for (var i = 1; i <= 4; i++) {
            this.lanes()[i].play();
        }
    };
    ViewModel.prototype.stopAllLanes = function () {
        this.isPlayingAllLanes(false);
        for (var i = 1; i <= 4; i++) {
            this.lanes()[i].stop();
        }
    };
    ViewModel.prototype.clear = function () {
        for (var i = 1; i <= 4; i++) {
            this.lanes()[i].clear();
        }
        this.createUrl();
    };
    ViewModel.prototype.createUrl = function () {
        var baseUrl = window.location.href.split('?')[0];
        var dataStr = LZString.compressToEncodedURIComponent(JSON.stringify(this.getJson()));
        window.history.pushState('', 'ByteBeatBank', baseUrl + '?v=' + this.version + '&d=' + dataStr);
    };
    ViewModel.prototype.setFromUrl = function (query) {
        var params = query.split('&');
        var version;
        var dataStr;
        _.forEach(params, function (param) {
            var pair = param.split('=');
            if (pair[0] === 'v') {
                version = pair[1];
            }
            if (pair[0] === 'd') {
                dataStr = pair[1];
            }
        });
        if (!dataStr) {
            this.isShowingTips = true;
            return;
        }
        try {
            var dataJson = JSON.parse(LZString.decompressFromEncodedURIComponent(dataStr));
            this.setFromJson(dataJson);
        }
        catch (e) {
            this.clear();
        }
    };
    ViewModel.prototype.getJson = function () {
        var r = [];
        for (var i = 1; i <= 4; i++) {
            r.push(this.lanes()[i].getJson());
        }
        return r;
    };
    ViewModel.prototype.setFromJson = function (json) {
        for (var i = 1; i <= 4; i++) {
            var l = json[i - 1];
            this.lanes()[i].setFromJson(l);
        }
        this.playAllLanes();
    };
    return ViewModel;
})();
/// <reference path="../Scripts/typings/knockout/knockout.d.ts" />
/// <reference path="../Scripts/typings/jquery/jquery.d.ts" />
var byteBeadCanvases = [];
ko.bindingHandlers.byteBeatCanvas = {
    init: function (element, valueAccess, allBindings, viewModel, bindingContext) {
        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            var hasByteBeat = bindingContext.$data;
            _.remove(byteBeadCanvases, hasByteBeat.byteBeatCanvas);
        });
    },
    update: function (element, valueAccess, allBindings, viewModel, bindingContext) {
        var hasByteBeat = bindingContext.$data;
        byteBeadCanvases.push(hasByteBeat.byteBeatCanvas = new ByteBeatCanvas(element, hasByteBeat.byteBeat));
    }
};
var interval = 1000 / 60;
var win = window;
var requestAnimFrame = win.requestAnimationFrame || win.webkitRequestAnimationFrame || win.mozRequestAnimationFrame || win.oRequestAnimationFrame || win.msRequestAnimationFrame || function (callback) {
    window.setTimeout(callback, interval / 2);
};
function updateByteBeatCanvases() {
    _.forEach(byteBeadCanvases, function (c) { return c.update(); });
    requestAnimFrame(updateByteBeatCanvases);
}
var audioPlayer;
var volumeStoreName = 'bytebeatbank-volume';
window.onload = function () {
    audioPlayer = new AudioPlayer();
    var volumeSlider = $('#volume').bootstrapSlider();
    volumeSlider.on('slide', function (e) {
        audioPlayer.setVolume(e.value / 200);
        amplify.store(volumeStoreName, e.value);
    });
    var storedVolume = U.clamp(0, 100, amplify.store(volumeStoreName));
    if (!_.isUndefined(storedVolume)) {
        volumeSlider.bootstrapSlider('setValue', storedVolume);
        audioPlayer.setVolume(storedVolume / 200);
    }
    var viewModel = new ViewModel();
    viewModel.isReady(audioPlayer.isReady);
    viewModel.setFromUrl(window.location.search.substring(1));
    ko.applyBindings(viewModel);
    audioPlayer.play();
    requestAnimFrame(updateByteBeatCanvases);
};
window.onunload = function () {
    audioPlayer.stop();
};
