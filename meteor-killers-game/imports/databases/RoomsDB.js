import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const RoomsDB = new Meteor.Collection('rooms');

RoomsDB.attachSchema(new SimpleSchema({
    _id: {type: String},
    roomStatus: {type: Number},
    roleCounts: {type: [Object], blackbox: true}, // {playerRole, count}}
    players: {type: [Object], blackbox: true}, // {uid, playerRole}

    deadPlayerUids: {type: [String]},
    // 天黑后的中间状态
    killersSelecting: {type: [Object], blackbox: true}, // {killerUid, targetUid}
    currentKilledUid: {type: String, optional: true}
}));

export default RoomsDB;
