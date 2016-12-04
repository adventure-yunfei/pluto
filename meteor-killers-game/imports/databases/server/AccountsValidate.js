import { Accounts } from 'meteor/account-base';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

Accounts.validateNewUser((user) => {
    new SimpleSchema({
        _id: { type: String },
        displayName: {type: String}
    }).validate(user);
});
