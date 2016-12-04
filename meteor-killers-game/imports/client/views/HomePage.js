import React from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import RoomsDB from '../../databases/RoomsDB';
import EnumRoomStatus from '../../enums/EnumRoomStatus';
import EnumPlayerRole from '../../enums/EnumPlayerRole';

export default class HomePage extends React.Component {
    handleBtnClick() {
        const newRoomId = Math.floor(Math.random() * 10000).toString();
        //RoomsDB.insert({
        //    _id: newRoomId,
        //    players: [{
        //        uid: 'iT5Cz8KXZXXWgw7f4',
        //        playerRole: EnumPlayerRole.Killer
        //    }, {
        //        uid: 'uyBvBqeRpd6uJqwxL',
        //        playerRole: EnumPlayerRole.Killer
        //    }, {
        //        uid: 'rLQapdQ6mqWrfQPeJ',
        //        playerRole: EnumPlayerRole.Witch
        //    }, {
        //        uid: 'HGYbfhfMnGWGKWpeA',
        //        playerRole: EnumPlayerRole.Predictor
        //    }, {
        //        uid: 'QMArxKcEMBHbxHWtz',
        //        playerRole: EnumPlayerRole.Villager
        //    }, {
        //        uid: '46rkb7ynqCntKburk',
        //        playerRole: EnumPlayerRole.Villager
        //    }, {
        //        uid: 'eer769TED5k3kGzBZ',
        //        playerRole: EnumPlayerRole.Villager
        //    }],
        //    roomStatus: EnumRoomStatus.Creating,
        //    killersSelecting: []
        //});
        RoomsDB.insert({
            _id: newRoomId,
            roleCounts: [
                {playerRole: EnumPlayerRole.Killer, count: 2},
                {playerRole: EnumPlayerRole.Villager, count: 2}
            ],
            players: [],
            roomStatus: EnumRoomStatus.Creating,
            deadPlayerUids: [],
            killersSelecting: [],
            currentKilledUid: null
        });
        this.props.router.push(`/room/${newRoomId}`);
    }
    render() {
        return (
            <div className="home-page">
                <button onClick={this.handleBtnClick.bind(this)}>New Room</button>
            </div>
        );
    }
}
