import React, { PropTypes } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import Toggle from 'material-ui/Toggle';
import RoomsDB from '../../databases/RoomsDB';
import EnumRoomStatus from '../../enums/EnumRoomStatus';
import PR from '../../enums/EnumPlayerRole';

import './CreateRoomPage.less';

export default class CreateRoomPage extends React.Component {
    static propTypes = {
        router: PropTypes.object.isRequired
    }
    state = {
        killerCnt: '',
        villagerCnt: '',
        hasWitch: true,
        hasPredictor: false,
        hasHunter: false
    }
    handleBtnClick = () => {
        const {killerCnt, villagerCnt, hasWitch, hasPredictor, hasHunter} = this.state,
            killerCntNum = parseInt(killerCnt, 10),
            villagerCntNum = parseInt(villagerCnt, 10),
            newRoomId = Math.floor(Math.random() * 10000).toString(),
            roleCounts = [];
        if (!killerCntNum) {
            alert('狼人数量必须大于0');
            return;
        }
        roleCounts.push({playerRole: PR.Killer, count: killerCntNum});
        if (villagerCntNum) {
            roleCounts.push({playerRole: PR.Villager, count: villagerCntNum});
        }
        if (hasWitch) {
            roleCounts.push({playerRole: PR.Witch, count: 1});
        }
        if (hasPredictor) {
            roleCounts.push({playerRole: PR.Predictor, count: 1});
        }
        if (hasHunter) {
            roleCounts.push({playerRole: PR.Hunter, count: 1});
        }
        RoomsDB.insert({
            _id: newRoomId,
            roleCounts: roleCounts,
            roomStatus: EnumRoomStatus.Creating
        });
        this.props.router.push(`/room/${newRoomId}`);
    }

    render() {
        const state = this.state,
            renderNumInput = (roleStateKey, label) => <TextField value={state[roleStateKey]} onChange={(e) => this.setState({[roleStateKey]: e.target.value})} floatingLabelText={label} type="number"/>,
            renderToggleInput = (roleStateKey, label) => <Toggle label={label} toggled={state[roleStateKey]} onToggle={(evt, toggled) => this.setState({[roleStateKey]: toggled})} style={{maxWidth: 250, marginTop: 20}}/>;
        return (
            <div className="create-room-page full-size">
                <div className="page-content full-size">
                    {renderNumInput('killerCnt', '请输入狼人角色个数')}
                    {renderNumInput('villagerCnt', '请输入村民角色个数')}
                    {renderToggleInput('hasWitch', '女巫')}
                    {renderToggleInput('hasPredictor', '预言家')}
                </div>

                <RaisedButton className="bottom-nav" onClick={this.handleBtnClick} primary={true} label="新建房间" fullWidth={true}/>
            </div>
        );
    }
}
