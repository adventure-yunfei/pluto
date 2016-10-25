import forEach from 'lodash/forEach';
import {post} from './request';

export default function uploadImage(e, {allowOverwrite = false} = {}) {
    if (e.target.files.length === 0) {
        return Promise.resolve({data: []});
    }
    var formData = new FormData();
    if (allowOverwrite) {
        formData.append('allowOverwrite', 'true');
    }
    forEach(e.target.files, file => {
        formData.append('images', file);
    });

    return post('/api/photo/upload_image', formData);
}
