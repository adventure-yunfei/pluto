import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const SessionsDB = new Mongo.Collection('sessions');

SessionsDB.attachSchema(new SimpleSchema({
    _id: {type: String},
    userIds: {type: [String]}
}));

export default SessionsDB;
