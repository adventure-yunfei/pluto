import {Component, Input} from '@angular/core';
import {Entry} from '../services/entries.service';

import './entry.component.less';

const WORD_SHOW_SPEED = 100;
const WORD_LEAVE_SPEED = 20;

@Component({
    selector: 'entry-item',
    template: require('./entry.component.html')
})
export class EntryComponent {
    @Input()
    entry: Entry;

    titleDisplaySize: number = 0;

    _showMoreWordTimer: number;
    _showLessWordTimer: number;

    clearWordTimer() {
        if (this._showMoreWordTimer) {
            clearTimeout(this._showMoreWordTimer);
            this._showLessWordTimer = null;
        }
        if (this._showLessWordTimer) {
            clearTimeout(this._showLessWordTimer);
            this._showLessWordTimer = null;
        }
    }

    showMoreWord() {
        this.clearWordTimer();
        const titleSize = this.entry.title.length,
            currDisplaySize = this.titleDisplaySize;
        if (currDisplaySize < titleSize) {
            this.titleDisplaySize = currDisplaySize + 1;
            this._showLessWordTimer = setTimeout(() => this.showMoreWord(), WORD_SHOW_SPEED);
        }
    }

    showLessWord() {
        this.clearWordTimer();
        const currDisplaySize = this.titleDisplaySize;
        if (currDisplaySize > 0) {
            this.titleDisplaySize = currDisplaySize - 1;
            this._showLessWordTimer = setTimeout(() => this.showLessWord(), WORD_LEAVE_SPEED);
        }
    }

    onMouseEnter() {
        this.showMoreWord();
    }

    onMouseLeave() {
        this.showLessWord();
    }
}
