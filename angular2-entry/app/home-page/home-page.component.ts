import {Component} from '@angular/core';
import {EntriesService, Entry} from '../services/entries.service';

@Component({
    selector: 'home-page',
    template: require('./home-page.component.html')
})
export class HomePageComponent {
    entries: Entry[];

    constructor(entriesService: EntriesService) {
        this.entries = entriesService.getEntries();
    }
}
