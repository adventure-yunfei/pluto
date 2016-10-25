import React, {PropTypes} from 'react';
import {findDOMNode} from 'react-dom';
import immutable from 'immutable';
import {connect} from 'react-redux';
import message from 'antd/lib/message';
import RaisedButton from 'material-ui/lib/raised-button';
import Checkbox from 'material-ui/lib/checkbox';

import RouteComponent from '../../../components/RouteComponent';
import clearStates from '../../../components/clear-states/clearStates';
import * as actions from './actions';

import {exclusiveExecutor} from '../../../../lib/utils';
import uploadImage from '../../../../lib/uploadImage';
import {resizeImgByMaxSize} from '../../../../lib/bosResouce';
import ImageUploader from '../../../components/image-uploader/ImageUploader';
import {getErrorMsg} from '../../errors';

import './PublishPhotography.scss';

const publisherDecorator = (comp) => connect((state) => ({
    photographyEditor: state.get('photographyEditor')
}))(
    clearStates(['photographyEditor'])(comp)
);

class PublishPhotography extends RouteComponent {
    static propTypes = {
        photographyEditor: PropTypes.instanceOf(immutable.Map).isRequired
    };
    static contextTypes = {
        router: PropTypes.object.isRequired
    };

    static fetchDataActions = [];

    constructor() {
        super(...arguments);
        this.state = {
            allowImgUploadOverwrite: false
        };
    }

    onAllowOverwriteChange = (e) => this.setState({allowImgUploadOverwrite: e.target.checked});
    onTitleChange = (e) => this.props.dispatch(actions.setData('title', e.target.value));
    onUploadClick = (e) => uploadImage(e, {allowOverwrite: this.state.allowImgUploadOverwrite}).then(({data: uploadedFiles}) => {
        this.props.dispatch(actions.setData(
            'content',
            this.props.photographyEditor.get('content') + uploadedFiles.map(({name}) => {
                return `<br/><img data-path="${name}" src="${resizeImgByMaxSize(name, 800)}"/>`;
            }).join('')
        ));
    });

    submit = () => {
        const {photographyEditor, dispatch} = this.props;
        const contentNode = findDOMNode(this.refs['content']).cloneNode(true);
        Array.from(contentNode.querySelectorAll('img[data-path]')).forEach(imgNode => {
            imgNode.src = '';
        });
        const hideLoading = message.loading('正在发布...');
        return Promise.resolve(dispatch(
            actions.save(photographyEditor.set('content', contentNode.innerHTML))
        ))
            .finally(hideLoading)
            .then(() => {
                message.success('发布成功');
                setTimeout(() => this.context.router.push(encodeURI(`/photography/${photographyEditor.get('title')}`)), 1500);
            }).catch(res => message.error('发布失败: ' + getErrorMsg(res.data.e)));
    };

    componentDidMount() {
        super.componentDidMount(...arguments);
        const contentNode = findDOMNode(this.refs['content']);
        Array.from(contentNode.querySelectorAll('img[data-path]')).forEach(imgNode => {
            imgNode.src = resizeImgByMaxSize(imgNode.dataset.path, 800);
            imgNode.removeAttribute('onclick');
        });
    }

    render() {
        const {photographyEditor: data} = this.props;
        return (
            <div className="PublishPhotography">
                <input value={data && data.get('title')} onChange={this.onTitleChange}
                       type="text" className="edit-title" name="title"/>
                <ImageUploader imgUrl="" onFileChange={this.onUploadClick} multiple={true}/>
                <Checkbox className="overwrite-checkbox" label="允许图片覆盖"
                          checked={this.state.allowImgUploadOverwrite} onCheck={this.onAllowOverwriteChange}/>
                <div ref="content" className="edit-content"
                     contentEditable="true" dangerouslySetInnerHTML={{__html: data && data.get('content') || ''}}></div>
                <br/><br/>
                <RaisedButton primary={true} label="保存" onClick={exclusiveExecutor(this.submit)}/>
            </div>
        );
    }
}

@publisherDecorator
export class EditPhotography extends PublishPhotography {
    static fetchDataActions = [actions.initEditPhotographyData];
}

@publisherDecorator
export class CreatePhotography extends PublishPhotography {
    static fetchDataActions = [actions.initCreatePhotographyData];
}
