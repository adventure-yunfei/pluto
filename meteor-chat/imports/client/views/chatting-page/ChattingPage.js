import React, { PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import { Accounts } from 'meteor/accounts-base'
import SessionsDB from '../../../databases/SessionsDB';
import MessagesDB from '../../../databases/MessagesDB';

class ChattingPage extends React.Component {
    componentWillMount() {
        if (!Meteor.loggingIn()) {
            Accounts.createUser({
                username: `guest-${Meteor.uuid()}`,
                password: Meteor.uuid()
            }, (err) => {
                if (err) {
                    alert(`创建用户失败: ${err}`);
                }
            });
        }
    }

    render() {
        const {user} = this.props;
        return (
            <div>
                Hello Chatting: {user && user.username}!
            </div>
        );
    }
}

export default createContainer(() => {
    Meteor.subscribe('users.all');
    Meteor.subscribe('sessions-messages');
    const user = Meteor.user();
        sessions = user ? SessionsDB.find({belongUserIds: user._id}).fetch() : [];
    sessions.forEach(session => {
        session.messages = MessagesDB.find({sessionId: session._id}).fetch();
    });
    return {
        user: user,
        sessions: sessions
    };
}, ChattingPage);
