import setActionToString from 'yfjs/lib/redux-utils/setActionToString';

export function clearState(statePaths) {
    return {
        type: clearState,
        payload: statePaths
    };
}

setActionToString('', {
    clearState
});
