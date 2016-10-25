import React, {PropTypes} from 'react';
import Component from 'react-pure-render/component';
import message from 'antd/lib/message';
import TextField from 'material-ui/lib/text-field';
import RaisedButton from 'material-ui/lib/raised-button';

import {exclusiveExecutor} from '../../../../lib/utils';
import {ENTER_KEY} from '../../../../lib/EnumKeyCodes';
import * as actions from './actions';
import {getErrorMsg} from '../../errors';

export default class Login extends Component {
    static propTypes = {
        dispatch: PropTypes.func.isRequired,
        location: PropTypes.object.isRequired
    };

    state = {
        username: '',
        password: ''
    };

    onUsernameChange = e => this.setState({username: e.target.value});
    onPasswordChange = e => this.setState({password: e.target.value});

    submitLogin = () => {
        const hideLoading = message.loading('登录中...');
        return this.props.dispatch(actions.login(this.state.username, this.state.password))
            .finally(hideLoading)
            .then(() => {
                location.href = this.props.location.query.originURL || '/';
            }, res => {
                message.error('登录失败: ' + getErrorMsg(res.data.e));
            });
    };

    onKeyDown = e => {
        if (e.keyCode === ENTER_KEY) {
            exclusiveExecutor(this.submitLogin)();
        }
    };

    render() {
        const {username, password} = this.state;

        return (
            <div className="Login">
                用户名:&nbsp;&nbsp; <TextField id="username" onKeyDown={this.onKeyDown} value={username} onChange={this.onUsernameChange} placeholder="用户名"/><br/>
                密码:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <TextField id="password" onKeyDown={this.onKeyDown} value={password} onChange={this.onPasswordChange} type="password" placeholder="密码"/><br/>

                <RaisedButton onClick={exclusiveExecutor(this.submitLogin)} label="登录" primary={true}/>
            </div>
        );
    }
}
