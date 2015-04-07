/// <reference path="../Scripts/typings/knockout/knockout.d.ts" />
/// <reference path="../Scripts/typings/lodash/lodash.d.ts" />

class Card {
    expressions: KnockoutObservableArray<Expression> = ko.observableArray<Expression>([]);
    isPlaying: KnockoutObservable<boolean> = ko.observable<boolean>(false);
    byteBeat: ByteBeat;
    byteBeatCanvas: ByteBeatCanvas;

    constructor() {
        this.byteBeat = audioPlayer.getByteBeat(0);
        var byteBeat = new ByteBeat();
        var es = byteBeat.createRandomExpressions();
        this.expressions(es);
    }

    play() {
        if (this.isPlaying()) {
            return;
        }
        audioPlayer.setExpressions(0, this.expressions());
        this.byteBeatCanvas.clear();
        this.isPlaying(true);
    }

    stop() {
        if (!this.isPlaying()) {
            return;
        }
        audioPlayer.setExpressions(0, null);
        this.isPlaying(false);
    }

    getJson() {
        return _.map(this.expressions(), e => e.getJson());
    }

    setFromJson(json) {
        this.expressions(_.map(json,(ej) => {
            var e = new Expression();
            e.setFromJson(ej);
            return e;
        }));
    }
}
