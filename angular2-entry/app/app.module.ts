import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';
import {HomePageComponent} from './home-page/home-page.component';
import {EntryComponent} from './home-page/entry.component';
import {EntriesService} from './services/entries.service';

@NgModule({
    imports: [ BrowserModule ],
    declarations: [ AppComponent, HomePageComponent, EntryComponent ],
    bootstrap: [ AppComponent ],
    providers: [ EntriesService ]
})
export class AppModule {

}
