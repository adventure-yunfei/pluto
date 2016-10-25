import React, {PropTypes} from 'react';
import {findDOMNode} from 'react-dom';
import Component from 'react-pure-render/component';
import immutable from 'immutable';
import Modal from 'antd/lib/modal';
import pick from 'lodash/pick';
import isEqual from 'lodash/isEqual';
import __assert__ from 'js-assert/__assert__';
import {Link} from 'react-router';
import {DragSource, DropTarget} from 'react-dnd';
import cn from 'classnames';
import TextField from 'material-ui/lib/text-field';
import Checkbox from 'material-ui/lib/checkbox';

import {resizeImgFitTo} from '../../../../lib/bosResouce';
import {renderOnBody, clearRenderer} from '../../../components/renderOnBody';
import uploadImage from '../../../../lib/uploadImage';
import ImageUploader from '../../../components/image-uploader/ImageUploader';

import {ENTRY} from '../../dndtypes';

export class EntryEditor extends Component {
    static propTypes = {
        editingEntry: PropTypes.instanceOf(immutable.Map),
        onSave: PropTypes.func.isRequired,
        close: PropTypes.func.isRequired
    };

    static open = (editingEntry, onSave) => {
        const renderId = renderOnBody((
            <EntryEditor onSave={onSave} close={() => clearRenderer(renderId)}
                         editingEntry={editingEntry}/>
        ));
    };

    constructor() {
        super(...arguments);
        this.state = {
            ...(this.props.editingEntry && this.props.editingEntry.toJS() || {}),
            allowImgUploadOverwrite: false
        };
    }

    onAllowOverwriteChange = (e) => this.setState({allowImgUploadOverwrite: e.target.checked});
    onTitleChange = (e) => this.setState({title: e.target.value});
    onLinkChange = (e) => this.setState({target_link: e.target.value});
    onFileChange = (e) => {
        uploadImage(e, {allowOverwrite: this.state.allowImgUploadOverwrite})
            .then(({data}) => {
                __assert__(data.length === 1);
                const {path} = data[0];
                this.setState({thumbnail_image_src: path});
            });
    };

    onOK = () => {
        this.props.onSave(pick(this.state, ['title', 'thumbnail_image_src', 'target_link']));
        this.props.close();
    };

    render() {
        const {title, thumbnail_image_src, target_link, allowImgUploadOverwrite} = this.state;
        return (
            <Modal className="entry-editor" visible={true} onOk={this.onOK} onCancel={this.props.close}>
                <div className="setting-row">
                    <div className="setting-title">标题：</div>
                    <TextField className="setting-input" value={title} onChange={this.onTitleChange} placeholder="请输入标题"/>
                </div>
                <div className="setting-row">
                    <div className="setting-title">链接：</div>
                    <TextField className="setting-input" value={target_link} onChange={this.onLinkChange} placeholder="请输入链接"/>
                </div>
                <div className="setting-row">
                    <div className="setting-title">预览图：</div>
                    <ImageUploader imgUrl={thumbnail_image_src && resizeImgFitTo(thumbnail_image_src, 156, 156)} onFileChange={this.onFileChange}/>
                    <Checkbox className="overwrite-checkbox" label="允许图片覆盖" checked={allowImgUploadOverwrite} onCheck={this.onAllowOverwriteChange}/>
                </div>
            </Modal>
        );
    }
}

const dragSpec = {
    beginDrag: props => ({entry: props.entry}),
    canDrag: props => props.editing,
    isDragging: (props, monitor) => monitor.getItem().entry.get('_id') === props.entry.get('_id')
};
const dragConnect = (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
});
const dropSpec = {
    canDrop: (props, monitor) => monitor.getItemType() === ENTRY,
    hover(props, monitor, component) {
        if (monitor.canDrop()) {
            const srcIdxInfo = props.getEntryIndexInfo(monitor.getItem().entry),
                dropIdxInfo = props.getEntryIndexInfo(props.entry);
            if (!isEqual(srcIdxInfo, dropIdxInfo)) {
                const {left, width} = findDOMNode(component).getBoundingClientRect(),
                    hoverOnLeftHalf = monitor.getClientOffset().x - left < width / 2,
                    tgtIdxInfo = {
                        sectionIndex: dropIdxInfo.sectionIndex,
                        entryIndex: hoverOnLeftHalf ? dropIdxInfo.entryIndex : dropIdxInfo.entryIndex + 1
                    };
                if (srcIdxInfo.sectionIndex === dropIdxInfo.sectionIndex && srcIdxInfo.entryIndex < dropIdxInfo.entryIndex) {
                    tgtIdxInfo.entryIndex--;
                }
                if (!isEqual(srcIdxInfo, tgtIdxInfo)) {
                    props.onRepositionEntry(srcIdxInfo, tgtIdxInfo);
                }
            }
        }
    }
};
const dropConnect = (connect, monitor) => ({
    connectDropTarget: connect.dropTarget()
});

@DragSource(ENTRY, dragSpec, dragConnect)
@DropTarget(ENTRY, dropSpec, dropConnect)
export default class Entry extends Component {
    static propTypes = {
        editing: PropTypes.bool.isRequired,
        entry: PropTypes.instanceOf(immutable.Map).isRequired,
        onEdit: PropTypes.func.isRequired,
        onDelete: PropTypes.func.isRequired,
        getEntryIndexInfo: PropTypes.func.isRequired,
        onRepositionEntry: PropTypes.func.isRequired,

        connectDragSource: PropTypes.func.isRequired,
        isDragging: PropTypes.bool.isRequired,
        connectDropTarget: PropTypes.func.isRequired
    };

    onSave = (changes) => this.props.onEdit(this.props.entry.merge(changes));
    onDoubleClick = () => EntryEditor.open(this.props.entry, this.onSave);

    render() {
        const {editing, entry, isDragging, connectDragSource, connectDropTarget} = this.props;
        const editingProps = !editing ? {} : {
            onClick: e => e.preventDefault(),
            onDoubleClick: this.onDoubleClick
        };
        return connectDragSource(connectDropTarget(
            <div className={cn({'Entry': true, 'is-dragging': isDragging})}>
                <Link to={entry.get('target_link')} {...editingProps}>
                    <img className="Entry_Thumbnail" src={resizeImgFitTo(entry.get('thumbnail_image_src'), 156, 156)} />
                    <div className="Entry_Title" >{entry.get('title')}</div>
                </Link>
            </div>
        ));
    }
}
