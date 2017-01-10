import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import React, { PropTypes } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import {GridList, GridTile} from 'material-ui/GridList';
import TextField from 'material-ui/TextField';
import Toggle from 'material-ui/Toggle';
import RoomsDB from '../../databases/RoomsDB';
import EnumRoomStatus from '../../enums/EnumRoomStatus';
import PR, {PlayRoleLabels} from '../../enums/EnumPlayerRole';
import { clearAllDBs } from '../../methods/AdminM';

import './HomePage.less';

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

class HomePage extends React.Component {
    static propTypes = {
        loginUser: PropTypes.shape({username: PropTypes.string}),
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

    handleClearBtnClick = () => {
        clearAllDBs({});
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
        const {loginUser} = this.props,
            state = this.state,
            btnNewRoom = <GridTile><RaisedButton onClick={this.handleBtnClick} primary={true} label="新建房间" fullWidth={true}/></GridTile>,
            renderNumInput = (roleStateKey, label) => <TextField value={state[roleStateKey]} onChange={(e) => this.setState({[roleStateKey]: e.target.value})} floatingLabelText={label} type="number"/>,
            renderToggleInput = (roleStateKey, label) => <Toggle label={label} toggled={state[roleStateKey]} onToggle={(evt, toggled) => this.setState({[roleStateKey]: toggled})} style={{maxWidth: 250, marginTop: 20}}/>;
        return (
            <div className="home-page">
                {renderNumInput('killerCnt', '请输入狼人角色个数')}
                {renderNumInput('villagerCnt', '请输入村民角色个数')}
                {renderToggleInput('hasWitch', '女巫')}
                {renderToggleInput('hasPredictor', '预言家')}

                {loginUser && loginUser.username === 'admin' ? (
                    <GridList className="bottom-nav" cellHeight="auto" padding={0}>
                        <GridTile><RaisedButton onClick={this.handleClearBtnClick} label="清理" fullWidth={true}/></GridTile>
                        {btnNewRoom}
                    </GridList>
                ) : <GridList className="bottom-nav" cellHeight="auto" cols={1}>{btnNewRoom}</GridList>}
            </div>
        );
    }
}

export default createContainer(() => ({
    loginUser: Meteor.user()
}), HomePage);
