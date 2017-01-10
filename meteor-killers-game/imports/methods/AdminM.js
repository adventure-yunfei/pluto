import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import RoomsDB from '../databases/RoomsDB';
import createMethod from '../utils/createMethod';

export const clearAllDBs = createMethod({
    name: 'admin.clearAllDBs',
    validate: new SimpleSchema({}).validator(),
    run() {
        const user = this.userId && Meteor.users.findOne(this.userId);
        if (!user || user.username !== 'admin') {
            throw new Meteor.Error('没有权限, 仅admin用户能操作');
        }
        Meteor.users.remove({_id: {$ne: this.userId}});
        RoomsDB.remove({});
    }
});