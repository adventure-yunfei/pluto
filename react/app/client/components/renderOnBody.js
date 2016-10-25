import ReactDOM, {render} from 'react-dom';
import uniqueId from 'lodash/uniqueId';

const containerMap = {};

export function renderOnBody(component) {
    const div = document.createElement('div');
    document.body.appendChild(div);

    render(component, div);

    const renderId = uniqueId('body_renderer_');
    containerMap[renderId] = div;
    return renderId;
}

export function clearRenderer(renderId) {
    const node = containerMap[renderId];
    ReactDOM.unmountComponentAtNode(node);
    document.body.removeChild(node);
}
