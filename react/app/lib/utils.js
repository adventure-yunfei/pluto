import createFragment from 'react-addons-create-fragment';

/**为列表初始化本地使用的 "_id" (从 "id" 拷贝)
 * @param {immutable.List} list */
function initClientId(list) {
    return list.map(item => item.set('_id', item.get('id')));
}

/**保证函数同时只被执行一次
 * @param {Function} fn 执行函数, 返回promise*/
const executorMap = new WeakMap();
function exclusiveExecutor(fn) {
    if (executorMap.get(fn)) {
        return executorMap.get(fn);
    }

    let executing = false;
    const executor = (...args) => {
        if (executing) {
            return;
        }

        executing = true;

        fn(...args).finally(() => executing = false);
    };

    executorMap.set(fn, executor);
    return executor;
}

function indexById(immutableList, _id) {
    return immutableList.findIndex(item => item.get('_id') === _id);
}

function keyedReactElems(elems) {
    return createFragment(elems.reduce((elemsMap, elem, idx) => {
        elemsMap['key_' + idx] = elem;
        return elemsMap;
    }, {}));
}

export {initClientId, exclusiveExecutor, indexById, keyedReactElems};
