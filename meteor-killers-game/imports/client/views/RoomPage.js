import React from 'react';
import fromPairs from 'lodash/fromPairs';
import uniq from 'lodash/uniq';
import random from 'lodash/random';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import EnumRoomStatus from '../../enums/EnumRoomStatus';
import EnumPlayerRole from '../../enums/EnumPlayerRole';
import RoomsDB from '../../databases/RoomsDB';
import arrayToMap from '../../utils/arrayToMap';

import './RoomPage.less';

// todo: debug
window.R = RoomsDB;

class RoomPage extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            selectedPlayerUid: null
        };
    }

    stepToNextStatus() {
        const {room, players} = this.props,
            updateRoom = (props) => {
                RoomsDB.update(
                    {_id: room._id},
                    {$set: props}
                );
            },
            dawnComing = (roomChanges = {}) => {
                const changes = {...roomChanges, roomStatus: EnumRoomStatus.WaitingAction},
                    currentKilledUid = roomChanges.currentKilledUid || room.currentKilledUid;
                if (currentKilledUid) {
                    changes.deadPlayerUids = uniq(room.deadPlayerUids.concat([currentKilledUid]));
                }
                updateRoom(changes);
            },
            getPlayerCntByRole = playerRole => players.filter(player => player.playerRole === playerRole).length;

        switch (room.roomStatus) {
            case EnumRoomStatus.Creating:
            {
                const expectedPlayerCnt = room.roleCounts.reduce((total, cntInfo) => total + cntInfo.count, 0);
                if (players.length === expectedPlayerCnt) {
                    const availableRoles = [];
                    room.roleCounts.forEach(({playerRole, count}) => {
                        for (let i = 0; i < count; i++) {
                            availableRoles.push(playerRole);
                        }
                    });
                    updateRoom({
                        roomStatus: EnumRoomStatus.WaitingAction,
                        players: room.players.map(({uid}) => {
                            const tgtRoleIdx = random(0, availableRoles.length - 1);
                            return {
                                uid: uid,
                                playerRole: availableRoles.splice(tgtRoleIdx, 1)[0]
                            };
                        })
                    });
                } else {
                    alert('房间角色数量不正确');
                    return false;
                }
                break;
            }
            case EnumRoomStatus.WaitingAction:
                updateRoom({roomStatus: EnumRoomStatus.KillersConfirmEachOther});
                break;
            case EnumRoomStatus.KillersConfirmEachOther:
                updateRoom({
                    roomStatus: EnumRoomStatus.KillersKilling,
                    // 进入新的夜晚时，重置中间值
                    killersSelecting: [],
                    currentKilledUid: null
                });
                break;
            case EnumRoomStatus.KillersKilling:
                if (room.killersSelecting.length === getPlayerCntByRole(EnumPlayerRole.Killer) && uniq(room.killersSelecting.map(item => item.targetUid)).length === 1) {
                    const hasWitch = getPlayerCntByRole(EnumPlayerRole.Witch) > 0,
                        hasPredictor = getPlayerCntByRole(EnumPlayerRole.Predictor) > 0,
                        currentKilledUid = room.killersSelecting[0].targetUid;
                    if (hasPredictor) {
                        updateRoom({roomStatus: EnumRoomStatus.PredictorChecking, currentKilledUid: currentKilledUid});
                    } else if (hasWitch) {
                        updateRoom({roomStatus: EnumRoomStatus.WitchCuring, currentKilledUid: currentKilledUid});
                    } else {
                        dawnComing({currentKilledUid: currentKilledUid});
                    }
                } else {
                    alert('请所有杀手选择相同目标!');
                    return false;
                }
                break;
            case EnumRoomStatus.PredictorChecking:
                if (this.state.selectedPlayerUid) {
                    const hasWitch = getPlayerCntByRole(EnumPlayerRole.Witch) > 0;
                    if (hasWitch) {
                        updateRoom({roomStatus: EnumRoomStatus.WitchCuring});
                    } else {
                        dawnComing();
                    }
                } else {
                    alert('请预言家选择查看身份的目标');
                    return false;
                }
                break;
            case EnumRoomStatus.WitchCuring:
                updateRoom({roomStatus: EnumRoomStatus.WitchPosioning});
                break;
            case EnumRoomStatus.WitchPosioning:
                dawnComing();
                break;
        }
        this.setState({selectedPlayerUid: null});
        return true;
    }

    handlePlayerItemClick(e) {
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
                        let itemHandled = false;
                        const killersSelecting = room.killersSelecting.map(item => {
                            if (item.killerUid === currentPlayer.uid) {
                                itemHandled = true;
                                return {...item, targetUid: playerUid};
                            } else {
                                return item;
                            }
                        });
                        if (!itemHandled) {
                            killersSelecting.push({
                                killerUid: currentPlayer.uid,
                                targetUid: playerUid
                            });
                        }
                        RoomsDB.update(
                            {_id: room._id},
                            {$set: {killersSelecting: killersSelecting}}
                        );
                    }
                    break;
            }
        }
    }

    handleJoinRoomClick() {
        const {room, currentUid} = this.props;
        if (room.players.length > 4) {
            alert('房间人数已满');
        } else {
            RoomsDB.update(
                {_id: room._id},
                {$set: {players: room.players.concat([{
                    uid: currentUid,
                    playerRole: EnumPlayerRole.NotSet
                }])}}
            );
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
                            onClick={this.handlePlayerItemClick.bind(this)} data-uid={player.uid}>
                            {player.username}
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
        const {room, loading, currentPlayer, currentUid} = this.props;
        if (loading) {
            return <div className="room-page">加载中...</div>;
        } else if (!currentUid) {
            return <div className="room-page">你还未登录，请登录</div>;
        } else if (!currentPlayer) {
            return <div className="room-page">你不在这个房间里 <button onClick={this.handleJoinRoomClick.bind(this)}>点击加入</button></div>;
        } else if (!room) {
            return <div className="room-page">房间不存在</div>;
        } else {
            return (
                <div className="room-page">
                    {this.renderRoomHeader()}
                    {this.renderPlayerListByStatus()}
                    <button onClick={this.stepToNextStatus.bind(this)}>下一步</button>
                </div>
            );
        }
    }
}

export default createContainer((props) => {
    const roomId = props.params.roomId,
        data = {
            loading: !Meteor.subscribe('rooms.byId', roomId).ready(),
            room: RoomsDB.findOne({_id: roomId}),
            currentUid: Meteor.userId()
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
