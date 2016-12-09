import React, {PropTypes} from 'react';
import random from 'lodash/random';
import R from 'ramda';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { createContainer } from 'meteor/react-meteor-data';
import arrayToMap from '../../utils/arrayToMap';
import { getVoteResult } from '../../utils/roomsUtils';
import EnumRoomStatus from '../../enums/EnumRoomStatus';
import EnumPlayerRole, { PlayRoleLabels } from '../../enums/EnumPlayerRole';
import RoomsDB from '../../databases/RoomsDB';
import { joinRoom, stepToNextStatus, voteAgain, killerSelecting, killerConfirmPartner, voteIt, restartRoom } from '../../methods/roomsMethods';

import './RoomPage.less';

const findByUid = R.curry((uid, list) => R.find(R.propEq('uid', uid))(list));

class MessageList extends React.Component {
    static propTypes = {
        room: PropTypes.object.isRequired,
        currentPlayer: PropTypes.object.isRequired
    }
    renderMessages() {
        const {room: {messages, deaths}, currentPlayer: {uid, playerRole}} = this.props,
            death = deaths.find(d => d.uid === uid);
        return messages.reduce((result, {text, msgTime, visibleRoles, invisibleRoles}, idx) => {
            let visible = true;
            if (visibleRoles) {
                visible = visibleRoles.indexOf(playerRole) !== -1;
            } else if (invisibleRoles) {
                visible = invisibleRoles.indexOf(playerRole) === -1;
            }
            if (death) {
                visible = visible || death.deadTime < msgTime;
            }
            if (visible) {
                result.push(<p key={idx}>{text}</p>);
            }
            return result;
        }, []);
    }
    render() {
        return (
            <div className="message-list-wrapper">
                <div className="message-list">
                    {this.renderMessages()}
                </div>
            </div>
        );
    }
}

class RoomPage extends React.Component {
    static propTypes = {
        room: PropTypes.object,
        players: PropTypes.array,
        currentPlayer: PropTypes.object,
        currentUid: PropTypes.string,
        loading: PropTypes.bool.isRequired,
        loggingIn: PropTypes.bool.isRequired
    }

    state = {
        selectedPlayerUid: null
    }

    stepToNextStatus(option = null) {
        const {room} = this.props;
        stepToNextStatus.call({roomId: room._id, roomStatus: room.roomStatus, ...option});
    }

    handlePlayerItemClick = (e) => {
        const targetUid = e.currentTarget.dataset.uid,
            {room, currentPlayer} = this.props,
            isAlive = uid => !room.deaths.find(death => death.uid === uid),
            canSelect = () => {
                if (!isAlive(currentPlayer.uid)) {
                    return false;
                }
                const {playerRole} = currentPlayer;
                switch (room.roomStatus) {
                    case EnumRoomStatus.KillersKilling:
                        return playerRole === EnumPlayerRole.Killer;
                    case EnumRoomStatus.PredictorChecking:
                        return playerRole === EnumPlayerRole.Predictor;
                    case EnumRoomStatus.WitchCuring:
                        return playerRole === EnumPlayerRole.Witch && room.witch.hasCure;
                    case EnumRoomStatus.WitchPosioning:
                        return playerRole === EnumPlayerRole.Witch && room.witch.hasPoison;
                    case EnumRoomStatus.Voting:
                        return !room.voting.find(voteInfo => voteInfo.uid === currentPlayer.uid);
                    default:
                        return false;
                }
            },
            canBeSelected = targetUid => isAlive(targetUid);
        if (canSelect() && canBeSelected(targetUid)) {
            this.setState({
                selectedPlayerUid: targetUid
            });
            switch (room.roomStatus) {
                case EnumRoomStatus.KillersKilling:
                    if (currentPlayer.playerRole === EnumPlayerRole.Killer) {
                        killerSelecting.call({
                            roomId: room._id,
                            killerUid: currentPlayer.uid,
                            targetUid: targetUid
                        });
                    }
                    break;
            }
        }
    }

    handleJoinRoomClick = () => {
        const {room, currentUid, loggingIn} = this.props;
        if (!loggingIn) {
            if (!currentUid) {
                Accounts.createUser({
                    username: Meteor.uuid(),
                    password: Meteor.uuid(),
                    profile: {
                        displayName: '游客-' + random(100, 9999)
                    }
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

    handleRestartClick = () => {
        if (confirm('确认重新开始游戏？')) {
            restartRoom.call({room: this.props.room._id});
        }
    }

    _resetTimerToNextStatus() {
        if (this._nextStatusTimer) {
            clearTimeout(this._nextStatusTimer);
        }
        this._nextStatusTimer = setTimeout(() => this.stepToNextStatus(), 2000);
    }
    componentWillReceiveProps(nextProps) {
        const getStatus = R.view(R.lensPath(['room', 'roomStatus']));
        const nextStatus = getStatus(nextProps);
        if (nextStatus != null && nextStatus !== getStatus(this.props)) {
            // 切换状态时重置选择状态
            this.setState({
                selectedPlayerUid: null
            });
            const isFirstPlayer = nextProps.room.players.length && nextProps.currentUid === nextProps.room.players[0].uid;
            let autoNextInterval = !isFirstPlayer ? null : (() => {
                    const isRoleDead = role => {
                        const player = nextProps.room.players.find(player => player.playerRole === role);
                        return !player || !!nextProps.room.deaths.find(death => death.uid === player.uid);
                    };
                    switch (nextStatus) {
                        case EnumRoomStatus.NightStart: return 2000;
                        case EnumRoomStatus.PredictorChecking: return isRoleDead(EnumPlayerRole.Predictor) ? 5000 : null;
                        case EnumRoomStatus.WitchCuring:
                            return isRoleDead(EnumPlayerRole.Witch) || !nextProps.room.witch.hasCure ? 5000 : null;
                        case EnumRoomStatus.WitchPosioning:
                            return isRoleDead(EnumPlayerRole.Witch) || !nextProps.room.witch.hasPoison ? 5000 : null;
                        default: return null;
                    }
                })();
            if (autoNextInterval) {
                this._resetTimerToNextStatus(autoNextInterval);
            }
        }
    }

    renderPlayerList(players, renderPlayerItem = null) {
        const deadUidMap = arrayToMap(this.props.room.deaths, 'uid');
        return (
            <ul className="player-list">
                {players.map(player => {
                    const nodeCfg = renderPlayerItem && renderPlayerItem(player) || {};
                    return (
                        <li key={player.uid} className={`player-item ${nodeCfg.className || ''} ${deadUidMap[player.uid] != null ? 'dead-player' : ''}`}
                            onClick={this.handlePlayerItemClick} data-uid={player.uid}>
                            {player.displayName || '游客'} {nodeCfg.content || ''}
                        </li>
                    );
                })}

            </ul>
        );
    }
    buildContent() {
        const {room, players, currentPlayer} = this.props,
            state = this.state,
            {inNight} = room,
            isFirstPlayer = currentPlayer.uid === players[0].uid,
            _deadUidMap = arrayToMap(room.deaths, 'uid'),
            _playerRoleMap = players.reduce((result, player) => {
                const {playerRole} = player;
                result[playerRole] = result[playerRole] || [];
                result[playerRole].push(player);
                return result;
            }, {}),
            isAlive = (uid = currentPlayer.uid) => _deadUidMap[uid] == null,
            getAliveOfRole = playerRole => (_playerRoleMap[playerRole] || []).filter(player => isAlive(player.uid)),
            userPlayerRole = currentPlayer.playerRole,
            content = {
                playerList: null,
                actions: null
            };
        let renderPlayerItem = null;
        switch (room.roomStatus) {
            case EnumRoomStatus.Creating:
                if (isFirstPlayer) {
                    content.actions = <button onClick={() => this.stepToNextStatus()}>开始游戏</button>;
                }
                break;
            case EnumRoomStatus.Created:
                if (isFirstPlayer) {
                    content.actions = <button onClick={() => this.stepToNextStatus()}>天黑请闭眼</button>;
                }
                break;
            case EnumRoomStatus.Sunrise:
                if (isFirstPlayer) {
                    content.actions = <button onClick={() => this.stepToNextStatus()}>开始投票</button>;
                }
                break;
            case EnumRoomStatus.KillersConfirmEachOther:
                if (userPlayerRole === EnumPlayerRole.Killer) {
                    const killerMap = _playerRoleMap[EnumPlayerRole.Killer];
                    renderPlayerItem = player => {
                        if (killerMap[player.uid] != null) {
                            return {className: 'selected-by-other'};
                        }
                    };
                    content.actions = (
                        <button disabled={inNight.partnerConfirmedKillerUids.indexOf(currentPlayer.uid) !== -1}
                                onClick={() => killerConfirmPartner.call({roomId: room._id, killerUid: currentPlayer.uid})}>
                            我知道了
                        </button>
                    );
                }
                break;
            case EnumRoomStatus.KillersKilling:
                if (isAlive() && userPlayerRole === EnumPlayerRole.Killer) {
                    const myUid = currentPlayer.uid,
                        killerTargetByMap = arrayToMap(inNight.killersSelecting, 'targetUid', 'killerUid');
                    renderPlayerItem = player => {
                        const targetByKillerUid = killerTargetByMap[player.uid];
                        if (targetByKillerUid != null) {
                            return {
                                className: targetByKillerUid === myUid ? 'selected-by-me' : 'selected-by-other'
                            };
                        }
                    };
                    const tgtConfirmed = inNight.killersSelecting.length === getAliveOfRole(EnumPlayerRole.Killer).length &&
                        R.uniq(inNight.killersSelecting.map(selInfo => selInfo.targetUid)).length === 1;
                    content.actions = <button disabled={!tgtConfirmed} onClick={() => this.stepToNextStatus()}>杀死目标 {!tgtConfirmed ? '(意见未统一)' : ''}</button>
                }
                break;
            case EnumRoomStatus.PredictorChecking:
                if (isAlive() && userPlayerRole === EnumPlayerRole.Predictor) {
                    renderPlayerItem = player => {
                        if (player.uid === this.state.selectedPlayerUid) {
                            return {className: 'selected-by-me'};
                        }
                    };
                    const handler = () => {
                        const selPlayer = state.selectedPlayerUid && players.find(player => player.uid === state.selectedPlayerUid);
                        if (state.selectedPlayerUid) {
                            alert(`玩家 ${selPlayer.displayName || '游客'} ${selPlayer.playerRole === EnumPlayerRole.Killer ? '是' : '不是'}狼人`);
                            this.stepToNextStatus({targetUid: state.selectedPlayerUid});
                        }
                    }
                    content.actions = <button disabled={!state.selectedPlayerUid} onClick={handler}>查看身份</button>;
                }
                break;
            case EnumRoomStatus.WitchCuring:
                if (isAlive() && userPlayerRole === EnumPlayerRole.Witch) {
                    renderPlayerItem = player => {
                        if (inNight.killedUid && inNight.killedUid === player.uid) {
                            return {className: 'selected-by-other'};
                        }
                    };
                    if (room.witch.hasCure) {
                        content.actions = (
                            <div>
                                <button onClick={() => this.stepToNextStatus({targetUid: inNight.killedUid})}>救</button>
                                <button onClick={() => this.stepToNextStatus()}>不救</button>
                            </div>
                        );
                    } else {
                        content.actions = <button disabled={true}>没有解药了</button>
                    }
                }
                break;
            case EnumRoomStatus.WitchPosioning:
                if (isAlive() && userPlayerRole === EnumPlayerRole.Witch) {
                    renderPlayerItem = player => {
                        if (player.uid === state.selectedPlayerUid) {
                            return {className: 'selected-by-me'};
                        }
                    };
                    if (room.witch.hasPoison) {
                        content.actions = (
                            <div>
                                <button disabled={!state.selectedPlayerUid} onClick={() => this.stepToNextStatus({targetUid: state.selectedPlayerUid})}>用毒药</button>
                                <button onClick={() => this.stepToNextStatus()}>不用毒药</button>
                            </div>
                        );
                    } else {
                        content.actions = <button disabled={true}>没有毒药了</button>
                    }
                }
                break;
            case EnumRoomStatus.Voting:
                if (isAlive()) {
                    const voteInfo = room.voting.find(vote => vote.uid === currentPlayer.uid);
                    renderPlayerItem = player => {
                        if (player.uid === (voteInfo ? voteInfo.targetUid : state.selectedPlayerUid)) {
                            return {className: 'selected-by-me'};
                        }
                    };
                    content.actions = (
                        <div>
                            <button disabled={!!voteInfo}
                                    onClick={() => state.selectedPlayerUid && voteIt.call({roomId: room._id, uid: currentPlayer.uid, targetUid: state.selectedPlayerUid})}>
                                确认投票
                            </button>
                            <button disabled={!!voteInfo}
                                    onClick={() => voteIt.call({roomId: room._id, uid: currentPlayer.uid, targetUid: null})}>
                                    放弃
                            </button>
                        </div>
                    );
                }
                break;
            case EnumRoomStatus.VoteEnd:
            {
                const {votedCountMap, highestVotedUid} = getVoteResult(room.voting);
                renderPlayerItem = player => {
                    const beVotedCnt = votedCountMap[player.uid];
                    if (beVotedCnt != null) {
                        return {className: `be-voted ${highestVotedUid === player.uid ? 'voted-dead' : ''}`, content: `${beVotedCnt}票`};
                    }
                };
                if (isFirstPlayer) {
                    content.actions = (
                        <div>
                            {!highestVotedUid && <button onClick={() => voteAgain.call({roomId: room._id})}>重新投票</button>}
                            <button onClick={() => this.stepToNextStatus()}>天黑请闭眼</button>
                        </div>
                    );
                }
            }
        }

        content.playerList = this.renderPlayerList(players, renderPlayerItem);
        return content;
    }
    renderRoomHeader() {
        const {room} = this.props,
            getStatusDesc = () => {
                switch (room.roomStatus) {
                    case EnumRoomStatus.Creating: return '正在创建房间...';
                    case EnumRoomStatus.Created: return '游戏开始';
                    case EnumRoomStatus.NightStart: return '天黑了...';
                    case EnumRoomStatus.KillersConfirmEachOther: return '狼人请互相确认身份';
                    case EnumRoomStatus.KillersKilling: return '狼人请杀人';
                    case EnumRoomStatus.PredictorChecking: return '预言家请查看身份';
                    case EnumRoomStatus.WitchCuring: return '女巫请选择是否救人';
                    case EnumRoomStatus.WitchPosioning: return '女巫请选择是否毒死一个人';
                    case EnumRoomStatus.Sunrise: return '天亮了';
                    case EnumRoomStatus.Voting: return '开始投票...';
                    case EnumRoomStatus.VoteEnd: return '投票结束';
                    case EnumRoomStatus.KillersWin: return '游戏结束，狼人获胜！';
                    case EnumRoomStatus.VillagersWin: return '游戏结束，平民获胜！';
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

        const {room, loading, currentPlayer} = this.props;
        if (loading) {
            return <div className="room-page">加载中...</div>;
        } else if (!room) {
            return <div className="room-page">房间不存在</div>;
        } else if (!currentPlayer) {
            return <div className="room-page">你不在这个房间里 <button onClick={this.handleJoinRoomClick}>点击加入</button></div>;
        } else {
            const isFirstPlayer = room.players[0].uid === currentPlayer.uid,
                content = this.buildContent();
            return (
                <div className="room-page">
                    <h3>{currentPlayer.displayName}, 你的身份是: {PlayRoleLabels[currentPlayer.playerRole]}</h3>
                    {isFirstPlayer && <button onClick={this.handleRestartClick}>重新开始</button>}
                    {this.renderRoomHeader()}
                    {content.playerList}
                    {content.actions}
                    <h1>进度</h1>
                    <MessageList room={room} currentPlayer={currentPlayer}/>
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
        const playerUids = R.map(R.prop('uid'))(data.room.players);
        data.loading = !Meteor.subscribe('accounts.byIds', playerUids).ready() || data.loading;
        const users = Meteor.users.find({_id: {$in: playerUids}}).fetch(),
            userMap = arrayToMap(users, '_id');
        data.players = data.room.players.map(player => {
            const relatedUser = userMap[player.uid];
            return {
                ...relatedUser,
                ...relatedUser && relatedUser.profile,
                uid: player.uid,
                playerRole: player.playerRole
            };
        });
        data.currentPlayer = findByUid(data.currentUid)(data.players);
    }

    return data;
}, RoomPage);
