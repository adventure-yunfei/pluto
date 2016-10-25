import * as actions from './actions';

export default function reducer(state = null, {type, payload}) {
    switch (type) {
        case actions.initPhotographyData:
            return payload;
        default:
            return state;
    }
}
