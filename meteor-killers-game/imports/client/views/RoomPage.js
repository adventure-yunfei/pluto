import { Accounts } from 'meteor/accounts-base';
import { createContainer } from 'meteor/react-meteor-data';
import React, {PropTypes} from 'react';
import DocumentTitle from 'react-document-title';
import R from 'ramda';
import { Meteor } from 'meteor/meteor';
import RaisedButton from 'material-ui/RaisedButton';
import IconButton from 'material-ui/IconButton';
import TextField from 'material-ui/TextField';
import IconDone from 'material-ui/svg-icons/action/done';
import arrayToMap from '../../utils/arrayToMap';
import { getVoteResult } from '../../utils/roomsUtils';
import { pushAudioPlay } from '../client-utils/AudioPlayUtils';
import EnumRoomStatus from '../../enums/EnumRoomStatus';
import EnumPlayerRole, { PlayRoleLabels } from '../../enums/EnumPlayerRole';
import RoomsDB from '../../databases/RoomsDB';
import { joinRoom, stepToNextStatus, voteAgain, killerSelecting, killerConfirmPartner, voteIt, restartRoom } from '../../methods/roomsMethods';
import { changeUserName } from '../../methods/accountMethods';

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

class RichUserName extends React.Component {
    static propTypes = {
        uid: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
    }
    componentWillMount() {
        this.setState({_name: this.props.name});
    }
    handleChangeConfirm = () => {
        const {uid} = this.props,
            {_name} = this.state;
        changeUserName({uid: uid, newName: _name});
    }
    render() {
        const {name} = this.props,
            {_name} = this.state,
            changed = name !== _name;
        return (
            <div className="rich-user-name">
                {changed && <IconButton className="apply-btn" onClick={this.handleChangeConfirm}><IconDone color="rgb(0, 188, 212)"/></IconButton>}
                <TextField className="user-name-field" name="rich-user-name" value={_name} onChange={e => this.setState({_name: e.target.value})}/>
            </div>
        );
    }
}

class RoomPage extends React.Component {
    static propTypes = {
        roomId: PropTypes.string.isRequired,
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
        stepToNextStatus({roomId: room._id, roomStatus: room.roomStatus, ...option});
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
                        killerSelecting({
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
                        displayName: '游客-' + (room.players.length + 1)
                    }
                }, err => {
                    if (err) {
                        alert(err);
                    } else {
                        joinRoom({roomId: room._id, uid: Meteor.userId()});
                    }
                });
            } else {
                joinRoom({roomId: room._id, uid: currentUid});
            }
        }
    }

    handleRestartClick = () => {
        if (confirm('确认重新开始游戏？')) {
            restartRoom({roomId: this.props.room._id});
        }
    }

    _resetTimerToNextStatus(timeout) {
        if (this._nextStatusTimer) {
            clearTimeout(this._nextStatusTimer);
        }
        this._nextStatusTimer = setTimeout(() => this.stepToNextStatus(), timeout);
    }
    onGetProps(prevProps, nextProps) {
        const getStatus = R.view(R.lensPath(['room', 'roomStatus'])),
            prevStatus = getStatus(prevProps),
            nextStatus = getStatus(nextProps);
        if (nextStatus != null && nextStatus !== prevStatus) {
            // 切换状态时重置选择状态
            this.setState({
                selectedPlayerUid: null
            });
            const isFirstPlayer = nextProps.room.players.length && nextProps.currentUid === nextProps.room.players[0].uid;
            if (isFirstPlayer) {
                // 自动跳转状态                
                let autoNextInterval = (() => {
                    const isRoleDead = role => {
                        const player = nextProps.room.players.find(player => player.playerRole === role);
                        return !player || !!nextProps.room.deaths.find(death => death.uid === player.uid);
                    };
                    switch (nextStatus) {
                        case EnumRoomStatus.NightStart: return 4000;
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

                // 播放声音
                const playAudioIds = [];
                switch (prevStatus) {
                    case EnumRoomStatus.KillersKilling:
                        playAudioIds.push('killer_close');
                        break;
                    case EnumRoomStatus.PredictorChecking:
                        playAudioIds.push({key: 'predictor_close', waitBefore: 7000});
                        break;
                    case EnumRoomStatus.WitchPosioning:
                        playAudioIds.push({key: 'witch_close', waitBefore: 10000});
                        break;
                }
                switch (nextStatus) {
                    case EnumRoomStatus.Creating:
                        playAudioIds.splice(0, playAudioIds.length);
                        break;
                    case EnumRoomStatus.NightStart:
                        playAudioIds.push('night_start');
                        break;
                    case EnumRoomStatus.KillersConfirmEachOther:
                        playAudioIds.push({key: 'killer_open', waitBefore: 3000}, 'killer_confirm');
                        break;
                    case EnumRoomStatus.KillersKilling:
                        playAudioIds.push('killer_killing');
                        break;
                    case EnumRoomStatus.PredictorChecking:
                        playAudioIds.push({key: 'predictor_open', waitBefore: 3000}, 'predictor_checking');
                        break;
                    case EnumRoomStatus.WitchCuring:
                        playAudioIds.push({key: 'witch_open', waitBefore: 3000}, 'witch_curing');
                        break;
                    case EnumRoomStatus.WitchPosioning:
                        playAudioIds.push({key: 'witch_poisoning', waitBefore: 7000});
                        break;
                    case EnumRoomStatus.Sunrise:
                        playAudioIds.push({key: 'dawn_coming', waitBefore: 3000});
                        break;
                    case EnumRoomStatus.VillagersWin:
                    case EnumRoomStatus.KillersWin:
                        if (prevStatus != null && prevStatus !== EnumRoomStatus.Voting && prevStatus !== EnumRoomStatus.VoteEnd && prevStatus !== EnumRoomStatus.Sunrise) {
                            playAudioIds.push({key: 'dawn_coming', waitBefore: 3000});
                        }
                        playAudioIds.push({key: 'game_end', waitBefore: 0});
                        playAudioIds.push({key: nextStatus === EnumRoomStatus.VillagersWin ? 'villager_win' : 'killer_win', waitBefore: 0});
                        break;
                }

                playAudioIds.forEach(audioCfg => pushAudioPlay(audioCfg));
            }
        }
    }
    componentWillMount() {
        this.onGetProps({}, this.props);
    }
    componentWillReceiveProps(nextProps) {
        this.onGetProps(this.props, nextProps);
    }

    renderPlayerList(players, renderPlayerItem = null) {
        const {room, currentUid} = this.props;
        const deadUidMap = arrayToMap(room.deaths, 'uid'),
            showRole = deadUidMap[currentUid] != null || (room.roomStatus === EnumRoomStatus.KillersWin || room.roomStatus === EnumRoomStatus.VillagersWin);
        return (
            <ul className="player-list">
                {players.map(player => {
                    const nodeCfg = renderPlayerItem && renderPlayerItem(player) || {};
                    return (
                        <li key={player.uid} className={`player-item ${nodeCfg.className || ''}`}
                            onClick={this.handlePlayerItemClick} data-uid={player.uid}>
                            {player.displayName || '游客'}
                            {showRole ? `[${PlayRoleLabels[player.playerRole]}]` : ''}
                            {nodeCfg.content || ''}
                            {deadUidMap[player.uid] != null ? <span className="color-red"> (已死亡) </span> : ''}
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
            _playerMap = arrayToMap(players, 'uid'),
            _deadUidMap = arrayToMap(room.deaths, 'uid'),
            _playerRoleMap = players.reduce((result, player) => {
                const {playerRole} = player;
                result[playerRole] = result[playerRole] || [];
                result[playerRole].push(player);
                return result;
            }, {}),
            isAlive = (uid = currentPlayer.uid) => _deadUidMap[uid] == null,
            getAliveOfRole = playerRole => (_playerRoleMap[playerRole] || []).filter(player => isAlive(player.uid)),
            stepNextHandler = () => this.stepToNextStatus(),
            userPlayerRole = currentPlayer.playerRole,
            content = {
                playerList: null,
                actions: null
            };
        let renderPlayerItem = null,
            actionCfgs = [];
        if (isFirstPlayer) {
            actionCfgs.push({label: '重新开始', onClick: this.handleRestartClick, primary: false, backgroundColor: 'rgb(232, 232, 232)'});
        }
        switch (room.roomStatus) {
            case EnumRoomStatus.Creating:
                if (isFirstPlayer) {
                    const expectedPlayerCnt = R.compose(
                        R.sum,
                        R.map(R.prop('count'))
                    )(room.roleCounts);
                    actionCfgs.push({label: '开始游戏', onClick: stepNextHandler, disabled: players.length !== expectedPlayerCnt});
                }
                break;
            case EnumRoomStatus.Created:
                if (isFirstPlayer) {
                    actionCfgs.push({label: '天黑请闭眼', onClick: stepNextHandler});
                }
                break;
            case EnumRoomStatus.Sunrise:
                if (isFirstPlayer) {
                    actionCfgs.push({label: '开始投票', onClick: stepNextHandler});
                }
                break;
            case EnumRoomStatus.KillersConfirmEachOther:
                if (userPlayerRole === EnumPlayerRole.Killer) {
                    const killerMap = arrayToMap(_playerRoleMap[EnumPlayerRole.Killer], 'uid');
                    renderPlayerItem = player => {
                        if (killerMap[player.uid] != null) {
                            return {className: 'selected-by-other', content: ' (狼人)'};
                        }
                    };
                    actionCfgs.push({
                        label: '我知道了',
                        onClick: () => killerConfirmPartner({roomId: room._id, killerUid: currentPlayer.uid}),
                        disabled: inNight.partnerConfirmedKillerUids.indexOf(currentPlayer.uid) !== -1
                    });
                }
                break;
            case EnumRoomStatus.KillersKilling:
                if (isAlive() && userPlayerRole === EnumPlayerRole.Killer) {
                    const killerTargetByMap = inNight.killersSelecting.reduce((result, {targetUid, killerUid}) => {
                            result[targetUid] = result[targetUid] || [];
                            result[targetUid].push(_playerMap[killerUid]);
                            return result;
                        }, {});
                    renderPlayerItem = player => {
                        const targetByKillers = killerTargetByMap[player.uid];
                        if (targetByKillers && targetByKillers.length) {
                            return {
                                className: 'selected-by-other',
                                content: ` (被 ${targetByKillers.map(killer=>killer.displayName).join(', ')} 选择)`
                            };
                        }
                    };
                    const hasTgtSelected = inNight.killersSelecting.length > 0,
                        tgtConfirmed = inNight.killersSelecting.length === getAliveOfRole(EnumPlayerRole.Killer).length &&
                            R.uniq(inNight.killersSelecting.map(selInfo => selInfo.targetUid)).length === 1;
                    actionCfgs.push({
                        label: `杀死目标 ${!hasTgtSelected ? ' (请选择目标)' : (!tgtConfirmed ? ' (意见未统一)' : '')}`,
                        onClick: () => !tgtConfirmed ? window.alert('请选择目标并统一意见') : this.stepToNextStatus()
                    });
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
                        if (state.selectedPlayerUid) {
                            const selPlayer = state.selectedPlayerUid && players.find(player => player.uid === state.selectedPlayerUid);
                            alert(`玩家 ${selPlayer.displayName || '游客'} ${selPlayer.playerRole === EnumPlayerRole.Killer ? '是' : '不是'}狼人`);
                            this.stepToNextStatus({targetUid: state.selectedPlayerUid});
                        } else {
                            window.alert('请选择要查看身份的目标');
                        }
                    }
                    actionCfgs.push({label: `查看身份${!state.selectedPlayerUid ? ' (请选择目标)':''}`, onClick: handler});
                }
                break;
            case EnumRoomStatus.WitchCuring:
                if (isAlive() && userPlayerRole === EnumPlayerRole.Witch) {
                    renderPlayerItem = player => {
                        if (inNight.killedUid && inNight.killedUid === player.uid) {
                            return {content: <span className="color-red"> (被狼人杀死) </span>};
                        }
                    };
                    if (room.witch.hasCure) {
                        actionCfgs.push(
                            {label: '不救', onClick: stepNextHandler},
                            {label: '救', onClick: () => this.stepToNextStatus({targetUid: inNight.killedUid})}
                        );
                    } else {
                        actionCfgs.push({label: '没有解药了', disabled: true});
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
                        actionCfgs.push(
                            {label: '不用毒药', onClick: stepNextHandler},
                            {label: '用毒药', onClick: () => !state.selectedPlayerUid ? window.alert('请选择目标') : this.stepToNextStatus({targetUid: state.selectedPlayerUid})}
                        );
                    } else {
                        actionCfgs.push({label: '没有毒药了', disabled: true});
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
                    const voteHandler = () => !state.selectedPlayerUid ? window.alert('请选择目标') : voteIt({roomId: room._id, uid: currentPlayer.uid, targetUid: state.selectedPlayerUid});
                    actionCfgs.push(
                        {label: '放弃', onClick: () => voteIt({roomId: room._id, uid: currentPlayer.uid, targetUid: null}), disabled: !!voteInfo},
                        {label: `确认投票${!state.selectedPlayerUid?' (请选择)':''}`, onClick: voteHandler, disabled: !!voteInfo}
                    );
                }
                break;
            case EnumRoomStatus.VoteEnd:
            {
                const {votedCountMap, highestVotedUid} = getVoteResult(room.voting);
                renderPlayerItem = player => {
                    const beVotedCnt = votedCountMap[player.uid];
                    if (beVotedCnt != null) {
                        const voteSourceNames = room.voting
                            .filter(item => item.targetUid === player.uid)
                            .map(item => _playerMap[item.uid].displayName)
                            .join(', ');
                        return {
                            className: `be-voted ${highestVotedUid === player.uid ? 'voted-dead' : ''}`,
                            content: `共${beVotedCnt}票 (${voteSourceNames})`
                        };
                    }
                };
                if (isFirstPlayer) {
                    if (highestVotedUid) {
                        actionCfgs.push({label: '天黑请闭眼', onClick: stepNextHandler});
                    } else {
                        actionCfgs.push(
                            {label: '重新投票', onClick: () => voteAgain({roomId: room._id})},
                            {label: '天黑请闭眼', onClick: () => this.stepToNextStatus()}
                        );
                    }
                }
            }
        }

        const lastActCfg = R.last(actionCfgs);
        if (lastActCfg && lastActCfg.primary == null) {
            lastActCfg.primary = true;
        }
        content.playerList = this.renderPlayerList(players, renderPlayerItem);
        content.actions = (
            <div className="bottom-nav pure-g">
                {actionCfgs.map((cfg, idx) => <RaisedButton className={`pure-u-1-${actionCfgs.length}`} key={`${room.roomStatus}-${idx}`} {...cfg}/>)}
            </div>
        );
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
                <h2>{getStatusDesc()}</h2>
            </div>
        );
    }
    render() {
        const {roomId, room, loading, currentPlayer} = this.props;
        let pg = null;
        if (loading) {
            pg = <div className="room-page">加载中...</div>;
        } else if (!room) {
            pg = <div className="room-page">房间不存在</div>;
        } else if (!currentPlayer) {
            pg = <div className="room-page" style={{textAlign: 'center'}}><span style={{lineHeight: '300px'}}>你不在这个房间里</span><RaisedButton className="bottom-nav" onClick={this.handleJoinRoomClick} label="点击加入" primary={true}/></div>;
        } else {
            const content = this.buildContent(),
                isDead = R.find(R.propEq('uid', currentPlayer.uid))(room.deaths);
            pg = (
                <div className="room-page">
                    <h3>
                        <RichUserName uid={currentPlayer.uid} name={currentPlayer.displayName}/>
                        你的身份是: {PlayRoleLabels[currentPlayer.playerRole]} {isDead ? <span className="color-red">(已死亡)</span> : ''}
                    </h3>
                    {this.renderRoomHeader()}
                    {content.playerList}
                    {content.actions}
                    <h1>进度</h1>
                    <MessageList room={room} currentPlayer={currentPlayer}/>
                </div>
            );
        }
        return <DocumentTitle title={`房间号: ${roomId}`}>{pg}</DocumentTitle>;
    }
}

export default createContainer((props) => {
    const roomId = props.params.roomId,
        data = {
            loading: !Meteor.subscribe('rooms.byId', roomId).ready(),
            roomId: roomId,
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

window._dev.RoomsDB = RoomsDB;
window._dev.EnumPlayerRole = EnumPlayerRole;
window._dev.EnumRoomStatus = EnumRoomStatus;
