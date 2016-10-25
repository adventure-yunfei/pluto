import axios from 'axios';
import {stringify} from 'querystring';

export function request(config) {
    return axios(config)
        .then((response) => {
            return (typeof response.data === 'object' && !response.data.e) ? response : Promise.reject(response);
        });
}

export const get = (url, config = {}) => request({url, ...config});
export const post = (url, data = {}, config = {}) => request({
    url,
    data,
    method: 'post',
    ...config
});
export const postByForm = (url, data = {}, config = {}) => post(url, stringify(data), {
    ...config,
    headers: {
        ...(config.headers || {}),
        'Content-Type': 'application/x-www-form-urlencoded'
    }
});
