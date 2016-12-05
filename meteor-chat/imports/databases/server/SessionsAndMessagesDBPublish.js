import { Meteor } from 'meteor/meteor';
import SessionsDB from '../SessionsDB';
import MessagesDB from '../MessagesDB';

Meteor.publishComposite('sessions-messages', function () {
    return {
        find() {
            if (!this.userId) {
                return this.ready();
            }
            return SessionsDB.find({belongUserIds: this.userId});
        },

        children: [{
            find(session) {
                return MessagesDB.find({sessionId: session._id});
            }
        }]
    };
});

Meteor.publish('users.all', function () {
    return Accounts.users.find({}, {
        // fields: {username: 1, 'services.resume': 1}
    });
});
