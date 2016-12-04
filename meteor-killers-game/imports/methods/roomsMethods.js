import uniq from 'lodash/uniq';
import random from 'lodash/random';
import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import arrayToMap from '../utils/arrayToMap';
import EnumRoomStatus from '../enums/EnumRoomStatus';
import EnumPlayerRole from '../enums/EnumPlayerRole';
import RoomsDB from '../databases/RoomsDB';

function shouldGetRoom(roomId) {
    const room = RoomsDB.findOne({_id: roomId});
    if (!room) {
        throw new Meteor.Error(`房间(${roomId})不存在`);
    }
    return room;
}

export const joinRoom = new ValidatedMethod({
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

export const killerSelecting = new ValidatedMethod({
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
        const existedIdx = room.killersSelecting.findIndex(selectInfo => selectInfo.killerUid === killerUid);
        let newSelectings = room.killersSelecting.slice();
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
            {$set: {killersSelecting: newSelectings}}
        );
    }
});

export const stepToNextStatus = new ValidatedMethod({
    name: 'rooms.nextStatus',
    validate: new SimpleSchema({
        roomId: {type: String},
        roomStatus: {type: Number}
    }).validator(),
    run({roomId, roomStatus}) {
        const room = shouldGetRoom(roomId);
        if (roomStatus !== room.roomStatus) {
            throw new Meteor.Error('客户端房间状态与服务端不一致，请稍后重试');
        }
        const {players} = room,
            updateRoom = (changes) => RoomsDB.update({_id: room._id}, {$set: changes}),
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
                    throw new Meteor.Error(`房间${roomId}角色数量不正确`);
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
                    throw new Meteor.Error('请所有杀手选择相同目标');
                }
                break;
            case EnumRoomStatus.PredictorChecking:
                if (getPlayerCntByRole(EnumPlayerRole.Witch) > 0 /*有女巫*/) {
                    updateRoom({roomStatus: EnumRoomStatus.WitchCuring});
                } else {
                    dawnComing();
                }
                break;
            case EnumRoomStatus.WitchCuring:
                updateRoom({roomStatus: EnumRoomStatus.WitchPosioning});
                break;
            case EnumRoomStatus.WitchPosioning:
                dawnComing();
                break;
        }
    }
})
