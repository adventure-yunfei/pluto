import {Injectable} from '@angular/core';

export interface Entry {
    title: string;
    desc: string;
    link: string;
}

@Injectable()
export class EntriesService {
    getEntries(): Entry[] {
        return [{
            title: 'baidu',
            desc: '',
            link: '//baidu.com'
        }, {
            title: 'google',
            desc: '',
            link: '//google.com'
        }];
    }
}
