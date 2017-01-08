import { Meteor } from 'meteor/meteor';

const userFieldsOpt = {'services.password': 0};

Meteor.publish('accounts.byIds', function (uids) {
    return Meteor.users.find({_id: {$in: uids}}, {fields: userFieldsOpt});
});

Meteor.publish('accounts.all', function () {
    return Meteor.users.find({}, {fields: userFieldsOpt});
});
