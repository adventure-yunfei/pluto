import { Meteor } from 'meteor/meteor';

Meteor.publish('accounts.byIds', function (uids) {
    return Meteor.users.find({_id: {$in: uids}});
});

Meteor.publish('accounts.all', function () {
    return Meteor.users.find({});
});
