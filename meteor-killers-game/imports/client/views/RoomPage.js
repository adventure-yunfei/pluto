import React from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import arrayToMap from '../../utils/arrayToMap';
import EnumRoomStatus from '../../enums/EnumRoomStatus';
import EnumPlayerRole from '../../enums/EnumPlayerRole';
import RoomsDB from '../../databases/RoomsDB';
import { joinRoom, stepToNextStatus, killerSelecting } from '../../methods/roomsMethods';

import './RoomPage.less';

class RoomPage extends React.Component {
    state = {
        selectedPlayerUid: null
    }

    stepToNextStatus() {
        const {room, players} = this.props;
        stepToNextStatus.call({roomId: room._id, roomStatus: room.roomStatus}, err => {
            if (err) {
                alert(err);
            } else {
                this.setState({selectedPlayerUid: null});     
            }
        });
    }

    handleStepToNextClick = () => {
        const {room, players} = this.props;
        stepToNextStatus.call({roomId: room._id, roomStatus: room.roomStatus}, err => {
            if (err) {
                alert(err);
            } else {
                this.setState({selectedPlayerUid: null});     
            }
        });
    }

    handlePlayerItemClick = (e) => {
        const playerUid = e.currentTarget.dataset.uid;
        if (this.props.room.deadPlayerUids.indexOf(playerUid) === -1) {
            this.setState({
                selectedPlayerUid: playerUid
            });
            const {room, currentPlayer} = this.props,
                currRole = currentPlayer.playerRole;
            switch (room.roomStatus) {
                case EnumRoomStatus.KillersKilling:
                    if (currRole === EnumPlayerRole.Killer) {
                        killerSelecting.call({
                            roomId: room._id,
                            killerUid: currentPlayer.uid,
                            targetUid: playerUid
                        });
                    }
                    break;
            }
        }
    }

    handleJoinRoomClick = () => {
        const {room, currentUid, loggingIn} = this.props;
        if (loggingIn) {
            return;
        } else {
            if (!currentUid) {
                Accounts.createUser({
                    username: Meteor.uuid(),
                    password: Meteor.uuid()
                }, err => {
                    if (err) {
                        alert(err);
                    } else {
                        joinRoom.call({roomId: room._id, uid: Meteor.userId()});
                    }
                });
            } else {
                joinRoom.call({roomId: room._id, uid: currentUid});
            }
        }
    }

    _buildRenderVariables() {
        this._playerMap = {};
        this._playerRoleMap = {};

        const {players} = this.props;
        if (players) {
            const playerMap = this._playerMap,
                playerRoleMap = this._playerRoleMap;
            players.forEach(player => {
                const {uid, playerRole} = player;
                playerMap[uid] = player;
                playerRoleMap[playerRole] = playerRoleMap[playerRole] || {};
                playerRoleMap[playerRole][uid] = player;
            });
        }
    }

    renderDefaultPlayerList(players, renderPlayerItem = null) {
        const deadUidMap = arrayToMap(this.props.room.deadPlayerUids);
        return (
            <ul className="player-list">
                {players.map(player => {
                    const nodeCfg = renderPlayerItem && renderPlayerItem(player) || {};
                    return (
                        <li key={player.uid} className={`player-item ${nodeCfg.className} ${deadUidMap[player.uid] != null ? 'dead-player' : ''}`}
                            onClick={this.handlePlayerItemClick} data-uid={player.uid}>
                            {player.profile && player.profile.displayName || '游客'}
                        </li>
                    );
                })}

            </ul>
        );
    }
    renderPlayerListByStatus() {
        const {room, players, currentPlayer} = this.props,
            userPlayerRole = currentPlayer.playerRole;
        let renderPlayerItem = null;
        switch (room.roomStatus) {
            case EnumRoomStatus.Creating:
                break;
            case EnumRoomStatus.KillersConfirmEachOther:
                if (userPlayerRole === EnumPlayerRole.Killer) {
                    const killerMap = this._playerRoleMap[EnumPlayerRole.Killer];
                    renderPlayerItem = player => {
                        if (killerMap[player.uid] != null) {
                            return {className: 'selected-by-other'};
                        }
                    };
                }
                break;
            case EnumRoomStatus.KillersKilling:
                if (userPlayerRole === EnumPlayerRole.Killer) {
                    const myUid = currentPlayer.uid,
                        killerTargetByMap = arrayToMap(room.killersSelecting, 'targetUid', 'killerUid');
                    renderPlayerItem = player => {
                        const targetByKillerUid = killerTargetByMap[player.uid];
                        if (targetByKillerUid != null) {
                            return {
                                className: targetByKillerUid === myUid ? 'selected-by-me' : 'selected-by-other'
                            };
                        }
                    };
                }
                break;
            case EnumRoomStatus.PredictorChecking:
                if (userPlayerRole === EnumPlayerRole.Predictor) {
                    renderPlayerItem = player => {
                        if (player.uid === this.state.selectedPlayerUid) {
                            return {className: 'selected-by-me'};
                        }
                    };
                }
                break;
            case EnumRoomStatus.WitchCuring:
                if (userPlayerRole === EnumPlayerRole.Witch) {
                    renderPlayerItem = player => {
                        if (player.uid === room.currentKilledUid) {
                            return {className: 'selected-by-other'};
                        }
                    };
                }
                break;
            case EnumRoomStatus.WitchPosioning:
                if (userPlayerRole === EnumPlayerRole.Witch) {
                    renderPlayerItem = player => {
                        if (player.uid === this.state.selectedPlayerUid) {
                            return {className: 'selected-by-me'};
                        }
                    };
                }
        }

        return this.renderDefaultPlayerList(players, renderPlayerItem);
    }
    renderRoomHeader() {
        const {room} = this.props,
            getStatusDesc = () => {
                switch (room.roomStatus) {
                    case EnumRoomStatus.Creating: return '正在创建房间...';
                    case EnumRoomStatus.WaitingAction: return '天亮了';
                    case EnumRoomStatus.KillersConfirmEachOther: return '狼人请互相确认身份';
                    case EnumRoomStatus.KillersKilling: return '狼人请杀人';
                    case EnumRoomStatus.PredictorChecking: return '预言家请查看身份';
                    case EnumRoomStatus.WitchCuring: return '女巫请选择是否救人';
                    case EnumRoomStatus.WitchPosioning: return '女巫请选择是否毒死一个人';
                }
            };
        return (
            <div className="room-header">
                <h1>{room._id}</h1>
                <h2>{getStatusDesc()}</h2>
            </div>
        );
    }
    render() {
        // todo: debug
        window.Room = this;

        this._buildRenderVariables();
        const {room, loading, currentPlayer} = this.props;
        if (loading) {
            return <div className="room-page">加载中...</div>;
        } else if (!currentPlayer) {
            return <div className="room-page">你不在这个房间里 <button onClick={this.handleJoinRoomClick}>点击加入</button></div>;
        } else if (!room) {
            return <div className="room-page">房间不存在</div>;
        } else {
            return (
                <div className="room-page">
                    {this.renderRoomHeader()}
                    {this.renderPlayerListByStatus()}
                    <button onClick={this.handleStepToNextClick}>下一步</button>
                </div>
            );
        }
    }
}

// TODO: debug
Meteor.subscribe('accounts.all');
window.RoomsDB = RoomsDB;

export default createContainer((props) => {
    const roomId = props.params.roomId,
        data = {
            loading: !Meteor.subscribe('rooms.byId', roomId).ready(),
            room: RoomsDB.findOne({_id: roomId}),
            currentUid: Meteor.userId(),
            loggingIn: Meteor.loggingIn()
        };
    if (data.room) {
        const playerUids = data.room.players.map(player => player.uid);
        data.loading = !Meteor.subscribe('accounts.byIds', playerUids).ready() || data.loading;
        const users = Meteor.users.find({_id: {$in: playerUids}}).fetch(),
            userMap = arrayToMap(users, '_id');
        data.players = data.room.players.map(player => {
            return {
                ...userMap[player.uid],
                uid: player.uid,
                playerRole: player.playerRole
            };
        });
        data.currentPlayer = data.players.find(player => player.uid === data.currentUid);
    }

    return data;
}, RoomPage);
