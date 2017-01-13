import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import React, { PropTypes } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import { alertDlg, confirmDlg } from '../client-utils/dialog';
import { clearAllDBs } from '../../methods/AdminM';

import './HomePage.less';

class HomePage extends React.Component {
    static propTypes = {
        loginUser: PropTypes.shape({username: PropTypes.string}),
        router: PropTypes.object.isRequired
    }

    handleClearBtnClick = () => confirmDlg('确认清理全部数据?').then(() => clearAllDBs({}))

    handleCreateRoomClick = () => this.props.router.push('/room/create')

    handleJoinRoomClick = () => {
        const roomIdComp = this.refs['join-room-id-input'],
            roomId = roomIdComp && roomIdComp.getValue();
        if (roomId) {
            this.props.router.push(`/room/${roomId}`);
        } else {
            alertDlg('请输入要加入的房间号');
        }
    }

    render() {
        const {loginUser} = this.props,
            isAdmin = loginUser && loginUser.username === 'admin',
            actions = (isAdmin ? [{
                label: '清理',
                onClick: this.handleClearBtnClick
            }] : []).concat([{
                label: '创建新房间',
                secondary: true,
                onClick: this.handleCreateRoomClick
            }, {
                label: '加入房间',
                primary: true,
                onClick: this.handleJoinRoomClick
            }]);
        return (
            <div className="home-page full-size">
                <div className="page-content full-size">
                    <TextField ref="join-room-id-input" floatingLabelText="请输入要加入的房间号" type="number"/>
                </div>
                <div className="bottom-nav pure-g">
                    {actions.map(actCfg => {
                        return <RaisedButton className={`pure-u-1-${actions.length}`} {...actCfg}/>;
                    })}
                </div>
            </div>
        );
    }
}

export default createContainer(() => ({
    loginUser: Meteor.user()
}), HomePage);
