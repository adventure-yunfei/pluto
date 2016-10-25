import React, {PropTypes} from 'react';
import Component from 'react-pure-render/component';
import immutable from 'immutable';
import {Link} from 'react-router';
import {connect} from 'react-redux';
import AppBar from 'material-ui/lib/app-bar';
import Tabs from 'material-ui/lib/tabs/tabs';
import Tab from 'material-ui/lib/tabs/tab';
import FlatButton from 'material-ui/lib/flat-button';

import Favicon from '../../../components/Favicon';

import './PageContainer.scss';

const NAV_BARS = [{
    label: '首页',
    to: '/'
}, {
    label: '关于',
    to: '/about'
}];

@connect(state => ({
    user: state.get('user')
}))
export default class PageContainer extends Component {
    static propTypes = {
        user: PropTypes.instanceOf(immutable.Map).isRequired,
        children: PropTypes.node,
        className: PropTypes.string
    };
    static contextTypes = {
        router: PropTypes.object.isRequired
    };

    jumpToHome = () => this.context.router.push('/');

    render() {
        const {user, className} = this.props;
        const isLoggedIn = user.get('isLoggedIn');
        const {router} = this.context;

        return (
            <div id="PageContainer" className={`PageContainer ${className || ''} ${isLoggedIn ? 'admin' : ''}`}>
                <Favicon href="/static/favicon.ico"/>
                <AppBar className="nav-bar" title="Hi Yunfei! "
                        iconElementLeft={<i/>}
                        style={{paddingLeft: 150}}>
                    <Tabs className="nav-bar-tab-list"
                          value={NAV_BARS.map(navBar => navBar.to).find(to => router.isActive(to, true)) || null}>
                        {NAV_BARS.map(({label, to}, idx) => (
                            <Tab key={idx} className="nav-bar-tab"label={label} value={to} onClick={() => router.push(to)}/>
                        ))}
                    </Tabs>
                    {isLoggedIn && <div className="username">{user.get('username')}</div>}
                    <Link className="login-and-out flex-box" to={isLoggedIn ? '/logout' : '/login'}>
                        <FlatButton label={isLoggedIn ? '登出' : '登录'}/>
                    </Link>
                </AppBar>

                <div className="page-content">
                    {this.props.children}
                </div>

                <div className="page-bottom" id="PageBottom" >Author: Yunfei. In Python &amp; Django.</div>
            </div>
        );
    }
}
