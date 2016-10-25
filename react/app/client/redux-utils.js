import React from 'react';
import immutable from 'immutable';
import {applyMiddleware, compose, createStore} from 'redux';
import {createDevTools} from 'redux-devtools';
import LogMonitor from 'redux-devtools-log-monitor';
import DockMonitor from 'redux-devtools-dock-monitor';

import promisePayloadMiddleware from 'yfjs/lib/redux-utils/promisePayloadMiddleware';
import ensureActionToStringMiddleware from 'yfjs/lib/redux-utils/ensureActionToStringMiddleware';


// 定制默认 LogMonitor 使其正常显示 type 类型为 function 的action
class MyLogMonitor extends LogMonitor {
    static update = function (monitorProps, state, action) {
        if (action && action.action && (typeof action.action.type === 'function')) {
            action.action.type = action.action.type.toString();
        }
        return LogMonitor.update(...arguments);
    };
}
// 用于debug时显示store状态
const DevTools = createDevTools(
    // Monitors are individually adjustable with props.
    // Consult their repositories to learn about those props.
    // Here, we put LogMonitor inside a DockMonitor.
    <DockMonitor toggleVisibilityKey="ctrl-h"
                 changePositionKey="ctrl-q"
                 defaultIsVisible={false}>
        <MyLogMonitor theme="tomorrow" />
    </DockMonitor>
);

const enhancer = compose(
    applyMiddleware(promisePayloadMiddleware, ...(__DEV__ ? [ensureActionToStringMiddleware] : [])),
    ...(__DEV__ ? [DevTools.instrument()] : [])
);
function configureStore(reducer, initialState = immutable.Map()) {
    return createStore(reducer, initialState, enhancer);
}

export {DevTools, configureStore};
