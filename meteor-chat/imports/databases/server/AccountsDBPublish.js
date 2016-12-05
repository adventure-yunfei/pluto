import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

Meteor.publish('users.all', function () {
    return Accounts.users.find({}, {
        // fields: {username: 1, 'services.resume': 1}
    });
});
