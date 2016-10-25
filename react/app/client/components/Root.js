import React, {PropTypes} from 'react';
import Component from 'react-pure-render/component';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import {DevTools} from '../redux-utils';

import 'antd/lib/index.css';
import 'purecss/build/base.css'; // purecss includes normalize.css
import 'purecss/build/grids.css';
import '../../../plugins/css/buttons.css';
import '../../../plugins/material-icons/material-icons.css';

import './overrides.scss';
import './common.scss';

@DragDropContext(HTML5Backend)
export default class Root extends Component {
    static propTypes = {
        children: PropTypes.node.isRequired
    };

    componentDidMount() {
        if (__DEV__) {
            // 仅在本地端开始显示 dev tool, 以避免 server render 和 client render 不一致导致的 react 警告
            this.setState({
                showDevTools: true
            });
        }
    }

    render() {
        return (
            <div className="Root">
                {this.props.children}
                {__DEV__ && this.state && this.state.showDevTools && <DevTools/>}
            </div>
        );
    }
}
