export default function arrayToMap(arr, getKey = null, getValue = null) {
    if (typeof getKey === 'string') {
        const keyField = getKey;
        getKey = item => item[keyField];
    }
    if (typeof getValue === 'string') {
        const valueField = getValue;
        getValue = item => item[valueField];
    }
    return arr.reduce((result, item) => {
        result[getKey ? getKey(item) : item] = getValue ? getValue(item) : item;
        return result;
    }, {});
}
