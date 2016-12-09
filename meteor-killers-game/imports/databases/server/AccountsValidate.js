import { Accounts } from 'meteor/accounts-base';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import R from 'ramda';

Accounts.validateNewUser(function (user) {
    new SimpleSchema({
        _id: {type: String},

        profile: {type: Object},
        'profile.displayName': {type: String}
    }).validate(R.pick(['_id', 'profile'])(user));
    
    return true;
});
