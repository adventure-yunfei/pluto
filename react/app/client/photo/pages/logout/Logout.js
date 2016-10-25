import React, {PropTypes} from 'react';
import Component from 'react-pure-render/component';
import {connect} from 'react-redux';

import * as actions from './actions';

@connect()
export default class Logout extends Component {
    static propTypes = {
        dispatch: PropTypes.func.isRequired
    };

    componentDidMount() {
        this.props.dispatch(actions.logout())
            .then(() => {
                location.href = '/';
            });
    }

    render() {
        return <div>登出中...</div>;
    }
}
