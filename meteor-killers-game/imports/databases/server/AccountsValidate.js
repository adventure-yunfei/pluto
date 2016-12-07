import pick from 'lodash/pick';
import { Accounts } from 'meteor/accounts-base';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

Accounts.validateNewUser(function (user) {
    new SimpleSchema({
        _id: {type: String},

        profile: {type: Object},
        'profile.displayName': {type: String}
    }).validate(pick(user, ['_id', 'profile']));
    
    return true;
});
