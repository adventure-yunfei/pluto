import React, {PropTypes} from 'react';
import immutable from 'immutable';
import {connect} from 'react-redux';
import uniqueId from 'lodash/uniqueId';
import message from 'antd/lib/message';
import IconButton from 'material-ui/lib/icon-button';
import TextField from 'material-ui/lib/TextField';
import CircularProgress from 'material-ui/lib/circular-progress';

import RouteComponent from '../../../components/RouteComponent';
import Section from './Section';
import * as actions from './actions';
import {indexById} from '../../../../lib/utils';
import hasPendingAction from '../../../hasPendingAction';
import {getErrorMsg} from '../../errors';

import './home.scss';
import './home_admin.scss';

@connect((state) => ({
    user: state.get('user'),
    sections: state.getIn(['home', 'sections']),
    pendingActions: state.get('pendingActions')
}))
export default class Home extends RouteComponent {
    static propTypes = {
        user: PropTypes.instanceOf(immutable.Map).isRequired,
        sections: PropTypes.instanceOf(immutable.List)
    };

    static fetchDataActions = [actions.initSections];

    state = {
        editing: false,
        newSectionName: ''
    };

    checkDataFetched() {
        return !!this.props.sections;
    }

    componentWillMount() {
        this.setState({
            editing: false
        });
    }

    toggleEditing = () => {
        this.setState({
            editing: !this.state.editing,
            initialSections: this.props.sections
        });
    };

    saveChanges = () => {
        const {dispatch, sections} = this.props,
            {initialSections} = this.state;
        if (initialSections.equals(sections)) {
            this.toggleEditing();
        } else {
            const hideLoading = message.loading('正在保存...');
            dispatch(actions.saveChanges(initialSections, sections))
                .finally(hideLoading)
                .then(() => {
                    this.toggleEditing();
                    message.success('保存成功');
                    setTimeout(() => location.reload(), 1500);
                }).catch(res => message.error('保存失败: ' + getErrorMsg(res.data.e)));
        }
    };

    deleteSection = section => {
        const {dispatch, sections} = this.props;
        dispatch(actions.setSections(
            sections.delete(indexById(sections, section.get('_id')))
        ));
    };
    editSection = section => {
        const {dispatch, sections} = this.props;
        dispatch(actions.setSections(
            sections.set(indexById(sections, section.get('_id')), section)
        ));
    };
    repositionSection = (srcIndex, tgtIndex) => {
        const {dispatch, sections} = this.props,
            srcSection = sections.get(srcIndex);
        dispatch(actions.setSections(
            sections.delete(srcIndex).insert(tgtIndex, srcSection)
        ));
    };
    /**@param {{sectionIndex, entryIndex}} srcInfo
     * @param {{sectionIndex, entryIndex}} tgtInfo*/
    repositionEntry = (srcInfo, tgtInfo) => {
        const {dispatch, sections} = this.props,
            srcEntry = sections.getIn([srcInfo.sectionIndex, 'entries', srcInfo.entryIndex]);
        dispatch(actions.setSections(
            sections.deleteIn([srcInfo.sectionIndex, 'entries', srcInfo.entryIndex])
                .updateIn([tgtInfo.sectionIndex, 'entries'], entries => entries.insert(tgtInfo.entryIndex, srcEntry))
        ));
    };
    onNewSecNameChange = e => this.setState({newSectionName: e.target.value});
    onAddSectionClick = () => {
        const {dispatch, sections} = this.props;
        const value = this.state.newSectionName.trim();
        if (!value) {
            message.warn('区域名称不能为空');
        } else if (sections.find(sec => sec.get('name') === value)) {
            message.warn('区域名称不能重复');
        } else {
            dispatch(actions.setSections(sections.push(immutable.fromJS({
                _id: uniqueId('new_section_'),
                name: value,
                entries: []
            }))));
        }
    };

    getSectionIndex = section => indexById(this.props.sections, section.get('_id'));
    getEntryIndexInfo = entry => {
        let entryIndex = -1;
        const sectionIndex = this.props.sections.findIndex(sec => {
            entryIndex = indexById(sec.get('entries'), entry.get('_id'));
            return entryIndex !== -1;
        });
        return {
            sectionIndex,
            entryIndex
        };
    };

    render() {
        const {user, sections, pendingActions} = this.props,
            {editing, newSectionName} = this.state,
            admin = user.get('isLoggedIn');

        return (
            <div className={`HomePage ${editing ? 'editing' : ''}`}>
                {sections && admin && [
                    <IconButton key="te" disabled={hasPendingAction(pendingActions, actions.saveChanges)} onClick={!editing ? this.toggleEditing : this.saveChanges}>
                        <i className={`material-icons ${!editing ? 'mi-edit' : 'mi-save'}`}>{!editing ? 'border_color' : 'save'}</i>
                    </IconButton>,
                    <div key="as" className="EditingTool flex-box" action="addSection">
                        <TextField id="new_sec-name" value={newSectionName} onChange={this.onNewSecNameChange}/>
                        <IconButton onClick={this.onAddSectionClick}><i className="material-icons mi-add">add</i></IconButton>
                    </div>
                ]}
                <div>
                    {sections && sections.map((sec, idx) => {
                        return <Section key={sec.get('_id')} editing={editing} section={sec}
                                        onEdit={this.editSection} onDelete={this.deleteSection}
                                        getSectionIndex={this.getSectionIndex} getEntryIndexInfo={this.getEntryIndexInfo}
                                        onRepositionSection={this.repositionSection} onRepositionEntry={this.repositionEntry}/>;
                    }) || <CircularProgress className="loading-tip" size={1.5}/>}
                </div>
            </div>
        );
    }
}
