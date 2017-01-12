import random from 'lodash/random';
import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import R from 'ramda';
import arrayToMap from '../utils/arrayToMap';
import { getVoteResult } from '../utils/roomsUtils';
import EnumRoomStatus from '../enums/EnumRoomStatus';
import EnumPlayerRole from '../enums/EnumPlayerRole';
import RoomsDB from '../databases/RoomsDB';
import createMethod from '../utils/createMethod';

function shouldGetRoom(roomId) {
    const room = RoomsDB.findOne({_id: roomId});
    if (!room) {
        throw new Meteor.Error(`房间(${roomId})不存在`);
    }
    return room;
}

export const joinRoom = createMethod({
    name: 'rooms.join',
    validate: new SimpleSchema({
        roomId: {type: String},
        uid: {type: String}
    }).validator(),
    run({roomId, uid}) {
        const room = shouldGetRoom(roomId),
            expectedPlayerCnt = room.roleCounts.reduce((result, {count}) => result + count, 0);
        if (room.players.length >= expectedPlayerCnt) {
            throw new Meteor.Error(`房间(${roomId})人数已满`);
        }
        if (room.players.findIndex(player => player.uid === uid) === -1) {
            RoomsDB.update(
                {_id: room._id},
                {$set: {players: room.players.concat([{
                    uid: uid,
                    playerRole: EnumPlayerRole.NotSet
                }])}}
            );
        }
    }
});

export const stepToNextStatus = createMethod({
    name: 'rooms.nextStatus',
    validate: new SimpleSchema({
        roomId: {type: String},
        roomStatus: {type: Number},
        targetUid: {type: String, optional: true}
    }).validator(),
    run({roomId, roomStatus, targetUid = null}) {
        const room = shouldGetRoom(roomId);
        if (roomStatus !== room.roomStatus) {
            throw new Meteor.Error('客户端房间状态与服务端不一致，请稍后重试');
        }
        const {players, inNight} = room,
            _playerMap = arrayToMap(players, 'uid'),
            _deadUidMap = arrayToMap(room.deaths, 'uid'),
            _playerRoleMap = players.reduce((result, player) => {
                const {playerRole} = player;
                result[playerRole] = result[playerRole] || [];
                result[playerRole].push(player);
                return result;
            }, {}),
            getPlayerNames = uids => Meteor.users.find({_id: {$in: uids}}, {fields: {'profile.displayName': 1}})
                .map(user => user.profile.displayName).sort().join(', '),
            getCntOfRole = playerRole => (_playerRoleMap[playerRole] || []).length,
            getAliveCntOfRole = playerRole => (_playerRoleMap[playerRole] || []).filter(player => _deadUidMap[player.uid] == null).length,
            getInNightInitial = () => ({partnerConfirmedKillerUids: [], killersSelecting: [], killedUid: null, cured: false, poisonedUid: null, checkedUid: null}),
            updateRoom = ($set, moreUpdator = {}) => RoomsDB.update(roomId, {$set: $set, ...moreUpdator}),
            pushMessage = (text, {visibleRoles = null, invisibleRoles = null} = {}) => RoomsDB.update(roomId, {$push: {messages: {text, msgTime: Date.now(), visibleRoles, invisibleRoles}}}),
            checkGameEnding = () => {
                const finalRoom = shouldGetRoom(roomId),
                    finalDeaths = finalRoom.deaths,
                    _finalDeadUidMap = arrayToMap(finalDeaths, 'uid'),
                    getFinalAliveCntOfRole = playerRole => (_playerRoleMap[playerRole] || []).filter(player => _finalDeadUidMap[player.uid] == null).length,
                    witchAlive = getFinalAliveCntOfRole(EnumPlayerRole.Witch) > 0,
                    hasCure = witchAlive && room.witch.hasCure,
                    hasPoison = witchAlive && room.witch.hasPoison,
                    killerAliveCnt = getFinalAliveCntOfRole(EnumPlayerRole.Killer),
                    totalAliveCnt = room.players.length - finalDeaths.length;
                if (killerAliveCnt === 0) {
                    updateRoom({roomStatus: EnumRoomStatus.VillagersWin});
                    pushMessage('狼人全部死亡，平民胜利！');
                } else if (hasCure && hasPoison) {
                    if (killerAliveCnt === 1 && totalAliveCnt === 2) {
                        updateRoom({roomStatus: EnumRoomStatus.VillagersWin});
                        pushMessage('仅剩一个狼人和有两瓶药的女巫，平民胜利！');
                    }
                } else if (killerAliveCnt >= totalAliveCnt / 2) {
                    updateRoom({roomStatus: EnumRoomStatus.KillersWin});
                    pushMessage('狼人数量占优，狼人胜利！');
                }
            },
            nightStart = () => {
                updateRoom({
                    roomStatus: EnumRoomStatus.NightStart,
                    // 进入新的夜晚时，重置中间值
                    inNight: getInNightInitial()
                }, {$inc: {round: 1}});
                pushMessage('天黑了...');
            },
            dawnComing = (roomChanges = {}) => {
                updateRoom({...roomChanges, roomStatus: EnumRoomStatus.Sunrise});
                pushMessage('天亮了！');
                const newRoom = shouldGetRoom(roomId),
                    newDeadUids = [];
                if (newRoom.inNight.killedUid && !newRoom.inNight.cured) {
                    newDeadUids.push(newRoom.inNight.killedUid);
                }
                if (newRoom.inNight.poisonedUid) {
                    newDeadUids.push(newRoom.inNight.poisonedUid);
                }
                pushMessage(newDeadUids.length ? `*${getPlayerNames(newDeadUids)}* 昨夜死亡` : '昨夜是平安夜');
                if (newDeadUids.length) {
                    RoomsDB.update(roomId, {$push: {deaths: {$each: newDeadUids.map(uid => ({uid, deadTime: Date.now()}))}}});
                }
                checkGameEnding();
            };

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
                        roomStatus: EnumRoomStatus.Created,
                        round: 0,
                        players: room.players.map(({uid}) => {
                            const tgtRoleIdx = random(0, availableRoles.length - 1);
                            return {
                                uid: uid,
                                playerRole: availableRoles.splice(tgtRoleIdx, 1)[0]
                            };
                        })
                    });
                } else {
                    throw new Meteor.Error(`房间${roomId}角色数量不正确`);
                }
                break;
            }
            case EnumRoomStatus.Created:
                nightStart();
                break;
            case EnumRoomStatus.NightStart:
                if (room.round === 1) {
                    // 首轮时，添加“狼人互相确认身份”步骤
                    updateRoom({roomStatus: EnumRoomStatus.KillersConfirmEachOther});
                    pushMessage('狼人正在互相确认身份...');
                } else {
                    updateRoom({roomStatus: EnumRoomStatus.KillersKilling});
                    pushMessage('狼人正在谋划暗杀目标...');
                }
                break;
            case EnumRoomStatus.KillersConfirmEachOther:
                updateRoom({roomStatus: EnumRoomStatus.KillersKilling});
                pushMessage('狼人正在谋划暗杀目标...');
                break;
            case EnumRoomStatus.KillersKilling:
                if (inNight.killersSelecting.length === getAliveCntOfRole(EnumPlayerRole.Killer) && R.uniq(inNight.killersSelecting.map(item => item.targetUid)).length === 1) {
                    const hasWitch = getCntOfRole(EnumPlayerRole.Witch) > 0,
                        hasPredictor = getCntOfRole(EnumPlayerRole.Predictor) > 0,
                        killedUid = inNight.killersSelecting[0].targetUid;
                    pushMessage(`狼人杀死了 *${getPlayerNames([killedUid])}*`, {visibleRoles: [EnumPlayerRole.Killer, EnumPlayerRole.Witch]});
                    if (hasPredictor) {
                        updateRoom({roomStatus: EnumRoomStatus.PredictorChecking, 'inNight.killedUid': killedUid});
                        pushMessage('预言家正在查看身份...');
                    } else if (hasWitch) {
                        updateRoom({roomStatus: EnumRoomStatus.WitchCuring, 'inNight.killedUid': killedUid});
                        pushMessage('女巫正在摆弄她的两瓶药水...');
                    } else {
                        dawnComing({'inNight.killedUid': killedUid});
                    }
                } else {
                    throw new Meteor.Error('请所有杀手选择相同目标');
                }
                break;
            case EnumRoomStatus.PredictorChecking:
                if (getAliveCntOfRole(EnumPlayerRole.Predictor) > 0) {
                    if (!inNight.checkedUid) { throw new Meteor.Error('请先选择目标查看身份'); }
                    pushMessage(`预言家查看了 *${getPlayerNames([inNight.checkedUid])}* 的身份，TA *${_playerMap[inNight.checkedUid].playerRole === EnumPlayerRole.Killer ? '是' : '不是'}* 狼人`, {visibleRoles: [EnumPlayerRole.Predictor]});
                }
                if (getCntOfRole(EnumPlayerRole.Witch) > 0 /*有女巫*/) {
                    updateRoom({roomStatus: EnumRoomStatus.WitchCuring});
                    pushMessage('女巫正在摆弄她的两瓶药水...');
                } else {
                    dawnComing();
                }
                break;
            case EnumRoomStatus.WitchCuring:
                if (getAliveCntOfRole(EnumPlayerRole.Witch) > 0 && targetUid) {
                    if (!room.witch.hasCure) { throw new Meteor.Error('女巫的解药已经用完'); }
                    if (targetUid !== inNight.killedUid) { throw new Meteor.Error('女巫使用解药指定了一个无效的目标'); }
                    pushMessage(`女巫使用解药救活了 *${getPlayerNames([targetUid])}*`, {visibleRoles: [EnumPlayerRole.Witch]});
                    updateRoom({
                        roomStatus: EnumRoomStatus.WitchPosioning,
                        'inNight.cured': true,
                        'witch.hasCure': false
                    });
                } else {
                    updateRoom({roomStatus: EnumRoomStatus.WitchPosioning});
                }
                break;
            case EnumRoomStatus.WitchPosioning:
                if (getAliveCntOfRole(EnumPlayerRole.Witch) > 0 && targetUid) {
                    if (!room.witch.hasPoison) { throw new Meteor.Error('女巫的毒药已经用完'); }
                    if (targetUid === inNight.killedUid && !inNight.cured) { throw new Meteor.Error('女巫使不能对已被狼人杀死的人使用毒药'); }
                    pushMessage(`女巫使用毒药毒死了了 *${getPlayerNames([targetUid])}*`, {visibleRoles: [EnumPlayerRole.Witch]});
                    dawnComing({
                        'inNight.poisonedUid': targetUid,
                        'witch.hasPoison': false
                    });
                } else {
                    dawnComing();
                }
                break;
            case EnumRoomStatus.Sunrise:
                updateRoom({roomStatus: EnumRoomStatus.Voting, voting: []});
                pushMessage('开始投票...');
                break;
            case EnumRoomStatus.Voting:
            {
                if (room.voting.length < (room.players.length - room.deaths.length)) { throw new Meteor.Error('还有人未投票，不能结束投票状态'); }
                room.voting.forEach(({uid, targetUid}) => {
                    if (targetUid) {
                        pushMessage(`*${getPlayerNames([uid])}*    投票给了    *${getPlayerNames([targetUid])}*`);
                    } else {
                        pushMessage(`*${getPlayerNames([uid])}*    弃权了`);
                    }
                });
                updateRoom({roomStatus: EnumRoomStatus.VoteEnd});
                pushMessage('投票结束');
                const {highestVotedUid, votedCountMap} = getVoteResult(room.voting);
                if (highestVotedUid) {
                    RoomsDB.update(roomId, {$push: {deaths: {uid: highestVotedUid, deadTime: Date.now()}}});
                    pushMessage(`*${getPlayerNames([highestVotedUid])}* 得到了最高票 *${votedCountMap[highestVotedUid]}* 票，被投死了`);
                    checkGameEnding();
                } else {
                    pushMessage('此轮投票没有达成多数一致票');   
                }
                break;
            }
            case EnumRoomStatus.VoteEnd:
                nightStart();
                break;
        }
    }
});

export const voteAgain = createMethod({
    name: 'rooms.voteAgain',
    validate: new SimpleSchema({
        roomId: {type: String}
    }).validator(),
    run({roomId}) {
        const room = shouldGetRoom(roomId);
        if (room.roomStatus !== EnumRoomStatus.VoteEnd) {
            throw new Error('重新投票之前必须处于投票完成状态');
        }
        RoomsDB.update(roomId, {
            $set: {
                roomStatus: EnumRoomStatus.Voting,
                voting: []
            }
        });
        RoomsDB.update(roomId, {$push: {messages: {text: '重新开始投票...', msgTime: Date.now()}}});
    }
});

export const killerSelecting = createMethod({
    name: 'rooms.killerSelecting',
    validate: new SimpleSchema({
        roomId: {type: String},
        killerUid: {type: String},
        targetUid: {type: String}
    }).validator(),
    run({roomId, killerUid, targetUid}) {
        const room = shouldGetRoom(roomId),
            playerMap = arrayToMap(room.players, 'uid');
        if (playerMap[killerUid] == null || playerMap[targetUid] == null) {
            throw new Meteor.Error('玩家不在房间内');
        }
        if (playerMap[killerUid].playerRole !== EnumPlayerRole.Killer) {
            throw new Meteor.Error('你不是狼人，不能指定攻击目标');
        }
        const existedIdx = room.inNight.killersSelecting.findIndex(selectInfo => selectInfo.killerUid === killerUid);
        let newSelectings = room.inNight.killersSelecting.slice();
        if (existedIdx === -1) {
            newSelectings.push({killerUid, targetUid});
        } else {
            newSelectings[existedIdx] = {
                ...newSelectings[existedIdx],
                targetUid
            };
        }
        RoomsDB.update(
            {_id: roomId},
            {$set: {'inNight.killersSelecting': newSelectings}}
        );
    }
});

export const killerConfirmPartner = createMethod({
    name: 'rooms.killerConfirmPartner',
    validate: new SimpleSchema({
        roomId: {type: String},
        killerUid: {type: String}
    }).validator(),
    run({roomId, killerUid}) {
        RoomsDB.update(roomId, {
            $addToSet: {'inNight.partnerConfirmedKillerUids': killerUid}
        });
        const room = shouldGetRoom(roomId);
        // 全都确认后，进入下一步
        if (room.players.filter(p => p.playerRole === EnumPlayerRole.Killer).every(p => room.inNight.partnerConfirmedKillerUids.indexOf(p.uid) !== -1)) {
            stepToNextStatus({roomId: roomId, roomStatus: room.roomStatus});
        }
    }
});

export const predictorCheckTarget = createMethod({
    name: 'rooms.predictorCheckTarget',
    validate: new SimpleSchema({
        roomId: {type: String},
        targetUid: {type: String}
    }).validator(),
    run({roomId, targetUid}) {
        const room = shouldGetRoom(roomId),
            findByUid = R.find(R.propEq('uid', targetUid));
        if (room.inNight.checkedUid) { throw new Error('你已经查看过其中一个人的身份了'); }
        if (!findByUid(room.players)) { throw new Meteor.Error('要查看身份的目标玩家不在房间内'); }
        if (findByUid(room.deaths)) { throw new Meteor.Error('要查看身份的目标玩家已死亡'); }
        RoomsDB.update(roomId, {
            $set: {'inNight.checkedUid': targetUid}
        });
    }
})

export const voteIt = createMethod({
    name: 'rooms.voteIt',
    validate: new SimpleSchema({
        roomId: {type: String},
        uid: {type: String},
        targetUid: {type: String, optional: true} // 传null代表弃权
    }).validator(),
    run({roomId, uid, targetUid}) {
        const room = shouldGetRoom(roomId);
        if (room.roomStatus !== EnumRoomStatus.Voting) { throw new Meteor.Error('当前并未处于投票状态，不能投票'); }
        if (room.voting.find(voteInfo => voteInfo.uid === uid)) { throw new Meteor.Error('该用户已经投票'); }
        RoomsDB.update(roomId, {
            $addToSet: {voting: {uid, targetUid}}
        });
        if (room.voting.length + 1 >= (room.players.length - room.deaths.length)) {
            stepToNextStatus({roomId: roomId, roomStatus: room.roomStatus});
        }
    }
});

export const restartRoom = createMethod({
    name: 'rooms.restartRoom',
    validate: new SimpleSchema({
        roomId: {type: String}
    }).validator(),
    run({roomId}) {
        const room = shouldGetRoom(roomId);
        RoomsDB.remove(roomId);
        RoomsDB.insert({
            _id: roomId,
            roomStatus: EnumRoomStatus.Creating,
            roleCounts: room.roleCounts,
            players: room.players.map(player => ({uid: player.uid, playerRole: EnumPlayerRole.NotSet}))
        });
    }
});
