import {Component, PropTypes} from 'react';

let faviconNode = null;

export default class Favicon extends Component {
    static propTypes = {
        href: PropTypes.string.isRequired
    };

    static updateFavicon(href) {
        if (!faviconNode) {
            faviconNode = document.createElement('link');
            faviconNode.rel = 'icon';
            faviconNode.type = 'image/x-icon';
            document.head.appendChild(faviconNode);
        }

        faviconNode.href = href;
    }

    componentDidMount() {
        Favicon.updateFavicon(this.props.href);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.href !== nextProps.href) {
            Favicon.updateFavicon();
        }
    }

    render() {
        return null;
    }
}
