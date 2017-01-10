import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import createMethod from '../utils/createMethod';

export const changeUserName = createMethod({
    name: 'accounts.changeUserName',
    validate: new SimpleSchema({
        uid: {type: String},
        newName: {type: String}
    }).validator(),
    run({uid, newName}) {
        if (uid !== this.userId) {
            throw new Meteor.Error('只能修改自己的用户信息');
        }
        Meteor.users.update(uid, {
            $set: {'profile.displayName': newName}
        });
    }
});
