import { Meteor } from 'meteor/meteor';
import RoomsDB from '../RoomsDB';

Meteor.publish('rooms.byId', function (roomId) {
    return RoomsDB.find({_id: roomId});
});
