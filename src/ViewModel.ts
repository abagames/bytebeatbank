/// <reference path="../Scripts/typings/lodash/lodash.d.ts" />
/// <reference path="../Scripts/typings/knockout/knockout.d.ts" />

declare module LZString {
    function compressToEncodedURIComponent(obj: any): string;
    function decompressFromEncodedURIComponent(str: string): any;
}

class ViewModel {
    volume: KnockoutObservable<number> = ko.observable(10);
    cards: KnockoutObservableArray<Card> = ko.observableArray([]);
    lanes: KnockoutObservableArray<Lane> = ko.observableArray([]);
    isPlayingAllLanes: KnockoutObservable<boolean> = ko.observable(true);
    isReady: KnockoutObservable<boolean> = ko.observable(false);
    isShowingTips = false;

    constructor() {
        this.cards(_.times(5,(i) => {
            return new Card();
        }));
        this.lanes(_.times(5,(i) => {
            return new Lane(i, this);
        }));
        this.showTips = this.showTips.bind(this);
    }

    onAfterCardAdd(element, index, data) {
        $(element)
            .animate({ left: '100px' }, { duration: 0 })
            .animate({ left: '0' }, { duration: 500 });
    }

    showTips(element, data) {
        if (!this.isShowingTips) {
            return;
        }
        var lane: Lane = data;
        if (lane.index >= 1) {
            lane.showTips();
        }
    }

    checkAddingCard() {
        while (this.cards().length < 5) {
            this.cards.push(new Card());
        }
    }

    playAllLanes() {
        this.isPlayingAllLanes(true);
        for (var i = 1; i <= 4; i++) {
            this.lanes()[i].play();
        }
    }

    stopAllLanes() {
        this.isPlayingAllLanes(false);
        for (var i = 1; i <= 4; i++) {
            this.lanes()[i].stop();
        }
    }

    clear() {
        for (var i = 1; i <= 4; i++) {
            this.lanes()[i].clear();
        }
        this.createUrl();
    }

    version = '1';
    createUrl() {
        var baseUrl = window.location.href.split('?')[0];
        var dataStr = LZString.compressToEncodedURIComponent(JSON.stringify(this.getJson()));
        window.history.pushState('', 'ByteBeatBank', baseUrl +
            '?v=' + this.version + '&d=' + dataStr);
    }

    setFromUrl(query: string) {
        var params = query.split('&');
        var version: string;
        var dataStr: string;
        _.forEach(params,(param) => {
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
        } catch (e) {
            this.clear();
        }
    }

    getJson() {
        var r = [];
        for (var i = 1; i <= 4; i++) {
            r.push(this.lanes()[i].getJson());
        }
        return r;
    }

    setFromJson(json) {
        for (var i = 1; i <= 4; i++) {
            var l = json[i - 1];
            this.lanes()[i].setFromJson(l);
        }
        this.playAllLanes();
    }
}
