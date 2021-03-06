import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const RoomsDB = new Meteor.Collection('rooms');

RoomsDB.attachSchema(new SimpleSchema({
    _id: {type: String},

    roomStatus: {type: Number},

    roleCounts: {type: [Object]}, 'roleCounts.$.playerRole': {type: Number}, 'roleCounts.$.count': {type: Number},

    players: {type: [Object], defaultValue: []}, 'players.$.uid': {type: String}, 'players.$.playerRole': {type: Number},

    round: {type: Number, defaultValue: 0},

    deaths: {type: [Object], defaultValue: []}, 'deaths.$.uid': {type: String}, 'deaths.$.deadTime': {type: Number},

    witch: {type: Object, defaultValue: {}}, 'witch.hasCure': {type: Boolean, defaultValue: true}, 'witch.hasPoison': {type: Boolean, defaultValue: true},

    messages: {type: [Object], defaultValue: []},
    'messages.$.text': {type: String},
    'messages.$.msgTime': {type: Number},
    'messages.$.visibleRoles': {type: [Number], optional: true},
    'messages.$.invisibleRoles': {type: [Number], optional: true},

    'inDay': {type: Object, defaultValue: {}},
    'inDay.voting': {type: [Object], defaultValue: []}, 'inDay.voting.$.uid': {type: String}, 'inDay.voting.$.targetUid': {type: String, optional: true}, // targetUid 为 null 代表弃权
    'inDay.voteCandidates': {type: [String], optional: true}, // 被投票的候选人 (最高票有多个时，重新投票后只能投给这些候选人)

    // 天黑后的中间状态
    inNight: {type: Object, defaultValue: {}},
    'inNight.partnerConfirmedKillerUids': {type: [String], defaultValue: []},
    'inNight.killersSelecting': {type: [Object], defaultValue: []}, 'inNight.killersSelecting.$.killerUid': {type: String}, 'inNight.killersSelecting.$.targetUid': {type: String},
    'inNight.killedUid': {type: String, optional: true},
    'inNight.cured': {type: Boolean, defaultValue: false},
    'inNight.poisonedUid': {type: String, optional: true},
    'inNight.checkedUid': {type: String, optional: true}

}));

export default RoomsDB;
