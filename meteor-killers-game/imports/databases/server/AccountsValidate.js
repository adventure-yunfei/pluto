import pick from 'lodash/pick';
import { Accounts } from 'meteor/accounts-base';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

Accounts.validateNewUser((user) => {
    new SimpleSchema({
        _id: {type: String},
        'profile.displayName': {type: String, optional: true}
    }).validate(pick(user, ['_id', 'profile']));

    return true;
});
