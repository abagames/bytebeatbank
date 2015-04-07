/// <reference path="../Scripts/typings/knockout/knockout.d.ts" />
/// <reference path="../Scripts/typings/jquery/jquery.d.ts" />

declare module amplify {
    function store(key: string, value: any, hash?: any);
    function store(key: string);
}

var byteBeadCanvases: ByteBeatCanvas[] = [];

(<any>ko.bindingHandlers).byteBeatCanvas = {
    init: (element, valueAccess, allBindings, viewModel, bindingContext) => {
        ko.utils.domNodeDisposal.addDisposeCallback(element,() => {
            var hasByteBeat = bindingContext.$data;
            _.remove(byteBeadCanvases, hasByteBeat.byteBeatCanvas);
        });
    },
    update: (element, valueAccess, allBindings, viewModel, bindingContext) => {
        var hasByteBeat = bindingContext.$data;
        byteBeadCanvases.push(
            hasByteBeat.byteBeatCanvas = new ByteBeatCanvas(element, hasByteBeat.byteBeat));
    }
};

var interval = 1000 / 60;
var win: any = window;
var requestAnimFrame =
    win.requestAnimationFrame ||
    win.webkitRequestAnimationFrame ||
    win.mozRequestAnimationFrame ||
    win.oRequestAnimationFrame ||
    win.msRequestAnimationFrame ||
    function(callback) {
        window.setTimeout(callback, interval / 2);
    };

function updateByteBeatCanvases() {
    _.forEach(byteBeadCanvases,(c) => c.update());
    requestAnimFrame(updateByteBeatCanvases);
}

var audioPlayer: AudioPlayer;
var volumeStoreName = 'bytebeatbank-volume';

window.onload = () => {
    audioPlayer = new AudioPlayer();
    var volumeSlider = (<any>$('#volume')).bootstrapSlider();
    volumeSlider.on('slide',(e) => {
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

window.onunload = () => {
    audioPlayer.stop();
};
