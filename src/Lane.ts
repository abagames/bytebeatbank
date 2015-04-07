/// <reference path="../Scripts/typings/knockout/knockout.d.ts" />
/// <reference path="../Scripts/typings/lodash/lodash.d.ts" />

class Lane {
    placedCards: KnockoutObservableArray<Card> = ko.observableArray([]);
    hasRoom: KnockoutObservable<boolean> = ko.computed(() => {
        return this.placedCards().length < 4;
    });
    isTrashBin: KnockoutObservable<boolean> = ko.observable(false);
    tipsMsg: KnockoutObservable<string> = ko.observable('');
    byteBeat: ByteBeat;

    constructor(public index: number, public viewModel: ViewModel) {
        this.isTrashBin(index === 0);
        if (!this.isTrashBin()) {
            this.byteBeat = audioPlayer.getByteBeat(index);
        }
        this.onaftermove = this.onaftermove.bind(this);
    }

    showTips() {
        setTimeout(() => {
           this.tipsMsg('drag and drop the cards here');
        }, this.index * 300);
        setTimeout(() => {
            this.tipsMsg('');
        }, 5000 + this.index * 300);
    }

    onaftermove(arg) {
        var card: Card = arg.item;
        card.stop();
        if (this.viewModel.isPlayingAllLanes()) {
            this.viewModel.playAllLanes();
        } else {
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
    }

    play() {
        var expressions: Expression[] = [];
        _.forEach(this.placedCards(),(c) => {
            _.forEach(c.expressions(),(e) => {
                expressions.push(e);
            });
        });
        audioPlayer.setExpressions(this.index, expressions);
    }

    stop() {
        if (this.viewModel.isPlayingAllLanes()) {
            return;
        }
        audioPlayer.setExpressions(this.index, null);
    }

    clear() {
        this.placedCards([]);
        audioPlayer.setExpressions(this.index, null);
    }

    getJson() {
        return _.map(this.placedCards(), c => c.getJson());
    }

    setFromJson(json: any[]) {
        this.placedCards(_.map(json,(cj) => {
            var c = new Card();
            c.setFromJson(cj);
            return c;
        }));
    }
}
