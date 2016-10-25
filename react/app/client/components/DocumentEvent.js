import {PropTypes} from 'react';
import Component from 'react-pure-render/component';
import capitalize from 'lodash/capitalize';

const supportedEvents = ['click', 'mouseup', 'mousedown', 'keyup', 'keydown'];
const reactEventMap = {
    ...(supportedEvents.reduce((result, evtName) => {
        result[evtName] = `on${capitalize(evtName)}`;
        return result;
    }, {})),
    mouseup: 'onMouseUp',
    mousedown: 'onMouseDown',
    keyup: 'onKeyUp',
    keydown: 'onKeyDown'
};

export default class DocumentEvent extends Component {
    static propTypes = {
        children: PropTypes.node
    };

    componentDidMount() {
        const props = this.props;
        supportedEvents.map(evtName => {
            if (props[reactEventMap[evtName]]) {
                window.addEventListener(evtName, props[reactEventMap[evtName]]);
            }
        });
    }

    componentWillUnmount() {
        const props = this.props;
        supportedEvents.map(evtName => {
            if (props[reactEventMap[evtName]]) {
                window.removeEventListener(evtName, props[reactEventMap[evtName]]);
            }
        });
    }

    render() {
        return this.props.children;
    }
}
