import React from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import RoomsDB from '../../databases/RoomsDB';
import EnumRoomStatus from '../../enums/EnumRoomStatus';
import PR, {PlayRoleLabels} from '../../enums/EnumPlayerRole';
import { clearAllDBs } from '../../methods/AdminM';

class NumberInput extends React.Component {
    getValue() {
        return this.state && parseInt(this.state.value, 10);
    }
    handleInputChange(e) {
        const value = e.target.value || '0';
        if (/^[0-9]+$/.test(value)) {
            this.setState({value: value});
        }
    }
    componentWillMount() {
        this.setState({value: '0'});
    }
    render() {
        return <input type="text" value={this.state && this.state.value} onChange={this.handleInputChange.bind(this)}/>;
    }
}

const AVAILABLE_ROLES = [PR.Killer, PR.Villager, PR.Witch, PR.Predictor, PR.Hunter];
export default class HomePage extends React.Component {
    handleBtnClick = () => {
        const newRoomId = Math.floor(Math.random() * 10000).toString();
        RoomsDB.insert({
            _id: newRoomId,
            roleCounts: AVAILABLE_ROLES.reduce((result, playerRole) => {
                const numInput = this.refs[`role-number-${playerRole}`],
                    cnt = numInput && numInput.getValue() || 0;
                if (cnt > 0) {
                    result.push({playerRole: playerRole, count: cnt});
                }
                return result;
            }, []),
            players: [],
            roomStatus: EnumRoomStatus.Creating,
            deadPlayerUids: [],
            killersSelecting: [],
            currentKilledUid: null
        });
        this.props.router.push(`/room/${newRoomId}`);
    }

    handleClearBtnClick = () => {
        clearAllDBs.call({});
    }

    renderCheckbox(playerRole) {
        return (
            <label key={playerRole}>
                {PlayRoleLabels[playerRole]}
                <NumberInput ref={`role-number-${playerRole}`}/>
            </label>
        );
    }

    render() {
        return (
            <div className="home-page">
                {AVAILABLE_ROLES.map(this.renderCheckbox.bind(this))}
                <button onClick={this.handleBtnClick}>新建房间</button>

                <p>
                    <button onClick={this.handleClearBtnClick}>清理</button>
                </p>
            </div>
        );
    }
}
