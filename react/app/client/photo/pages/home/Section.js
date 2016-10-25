import React, {PropTypes} from 'react';
import {findDOMNode} from 'react-dom';
import Component from 'react-pure-render/component';
import immutable from 'immutable';
import uniqueId from 'lodash/uniqueId';
import {DragSource, DropTarget} from 'react-dnd';
import cn from 'classnames';

import Entry, {EntryEditor} from './Entry';
import {indexById} from '../../../../lib/utils';
import {SECTION} from '../../dndtypes';

const dragSpec = {
    beginDrag: props => ({section: props.section}),
    canDrag: props => props.editing
};
const dragConnect = (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
});
const dropSpec = {
    canDrop: (props, monitor) => monitor.getItemType() === SECTION,
    hover(props, monitor, component) {
        if (monitor.canDrop()) {
            const srcIndex = props.getSectionIndex(monitor.getItem().section),
                dropIndex = props.getSectionIndex(props.section);
            if (srcIndex !== dropIndex) {
                const {top, height} = findDOMNode(component).getBoundingClientRect(),
                    hoverOnTopHalf = monitor.getClientOffset().y - top < height / 2;
                let tgtIndex = hoverOnTopHalf ? dropIndex : dropIndex + 1;
                if (srcIndex < dropIndex) {
                    tgtIndex--;
                }
                if (srcIndex !== tgtIndex) {
                    props.onRepositionSection(srcIndex, tgtIndex);
                }
            }
        }
    }
};
const dropConnect = (connect, monitor) => ({
    connectDropTarget: connect.dropTarget()
});

@DragSource(SECTION, dragSpec, dragConnect)
@DropTarget(SECTION, dropSpec, dropConnect)
export default class Section extends Component {
    static propTypes = {
        editing: PropTypes.bool.isRequired,
        section: PropTypes.instanceOf(immutable.Map).isRequired,
        onEdit: PropTypes.func.isRequired,
        onDelete: PropTypes.func.isRequired,
        getSectionIndex: PropTypes.func.isRequired,
        getEntryIndexInfo: PropTypes.func.isRequired,
        onRepositionSection: PropTypes.func.isRequired, // params(srcIndex, tgtIndex)
        onRepositionEntry: PropTypes.func.isRequired, // params(srcInfo: {sectionIndex, entryIndex}, tgtInfo: {sectionIndex, entryIndex})

        connectDragSource: PropTypes.func.isRequired,
        isDragging: PropTypes.bool.isRequired,
        connectDropTarget: PropTypes.func.isRequired
    };

    onDeleteSectionClick = () => this.props.onDelete(this.props.section);
    onAddEntryClick = () => {
        EntryEditor.open(null, ({title, thumbnail_image_src, target_link}) => {
            const {section, onEdit} = this.props;
            onEdit(section.update('entries', entries => entries.push(immutable.fromJS({
                _id: uniqueId('new_entry_'),
                title,
                thumbnail_image_src,
                target_link
            }))));
        });
    };

    deleteEntry = entry => this.props.onEdit(this.props.section.update('entries', entries => {
        return entries.delete(indexById(entries, entry.get('_id')));
    }));
    editEntry = entry => this.props.onEdit(this.props.section.update('entries', entries => {
        return entries.set(indexById(entries, entry.get('_id')), entry);
    }));
    repositionEntry = (srcIndex, tgtIndex) => {
        const {onEdit, section} = this.props;
        onEdit(section.update('entries', entries => {
            const srcEntry = entries.get(srcIndex);
            return entries.delete(srcIndex).insert(tgtIndex, srcEntry);
        }));
    };

    render() {
        const {editing, section, getEntryIndexInfo, onRepositionEntry,
            isDragging, connectDragSource, connectDropTarget} = this.props;

        return connectDragSource(connectDropTarget(
            <div className={cn({'Section': true, 'is-dragging': isDragging})}>
                <div className="Section_Title">
                    <span>{section.get('name')}</span>
                    {editing && (
                        <div className="EditingTool">
                            <i className="material-icons mi-add" onClick={this.onAddEntryClick}>add</i>
                            <i className="RemoveSection material-icons mi-remove" onClick={this.onDeleteSectionClick}>remove</i>
                        </div>
                    )}
                </div>
                <div className="Section_Entries" >
                    {section.get('entries').map((entry, idx) => {
                        return <Entry key={entry.get('_id')} editing={editing} entry={entry}
                                      onEdit={this.editEntry} onDelete={this.deleteEntry}
                                      getEntryIndexInfo={getEntryIndexInfo}
                                      onRepositionEntry={onRepositionEntry}/>;
                    })}
                </div>
            </div>
        ));
    }
}
