import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

const MAX_USER_COUNT = 10;

Accounts.onCreateUser((options, user) => {
    // if max user count reached, remove the most inactive users
    if (Meteor.users.find({}).count() >= MAX_USER_COUNT) {
        const users = Meteor.users.find({}).fetch(),
            getUserLastActiveTime = user => {
                let lastActiveTime = user.createdAt && user.createdAt.getTime() || -1;
                const loginTokens = user.services && user.services.resume && user.services.resume.loginTokens;
                if (loginTokens && loginTokens.length) {
                    loginTokens.forEach(token => {
                        const resumeTime = token && token.when && token.when.getTime() || -1;
                        if (resumeTime > lastActiveTime) {
                            lastActiveTime = resumeTime;
                        }
                    });
                }
                return lastActiveTime;
            };
        users.sort((a, b) => {
            return getUserLastActiveTime(a) - getUserLastActiveTime(b);
        });
        Meteor.users.remove({
            _id: {$in: users.slice(0, 5).map(user => user._id)}
        });
    }
    return user;
});
