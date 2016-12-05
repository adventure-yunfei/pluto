import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const MessagesDB = new Mongo.Collection('messages');

MessagesDB.attachSchema(new SimpleSchema({
    sessionId: {type: String},
    text: {type: String}
}));

export default MessagesDB;
