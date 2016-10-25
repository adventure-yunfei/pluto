const PREFIX = 'http://adventure030-image.bceimg.com';

const getUrl = filePath => PREFIX + filePath;

export function getImgUrl(filePath) {
    return getUrl(filePath) + '@f_jpg';
}

const set_w = width => width ? `,w_${width}` : '';
const set_h = height => height ? `,h_${height}` : '';

export function resizeImgByMaxSize(imgPath, width = null, height = null) {
    return `${getUrl(imgPath)}@s_0${set_w(width)}${set_h(height)}`;
}

export function resizeImgFitTo(imgPath, width, height) {
    return `${getUrl(imgPath)}@s_2${set_w(width)}${set_h(height || width)}`;
}
