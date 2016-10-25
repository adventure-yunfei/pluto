import React, {PropTypes} from 'react';
import Component from 'react-pure-render/component';
import cn from 'classnames';

import './ImageUploader.scss';

export default class ImageUploader extends Component {
    static propTypes = {
        onFileChange: PropTypes.func.isRequired,
        imgUrl: PropTypes.string,
        multiple: PropTypes.bool
    };
    static defaultProps = {
        imgUrl: '',
        multiple: false
    };

    render() {
        const {onFileChange, imgUrl, multiple} = this.props;
        const compProps = {
            className: cn({
                'image-uploader': true,
                'img-uploaded': !!imgUrl
            }),
            ...(imgUrl ? {
                style: {
                    backgroundImage: `url(${imgUrl})`
                }
            } : {})
        };

        return (
            <label {...compProps}>
                <i className="material-icons">cloud_upload</i>
                <div className="upload-text-tip">上传图片</div>
                <input type="file" onChange={onFileChange} multiple={multiple}/>
            </label>
        );
    }
}
