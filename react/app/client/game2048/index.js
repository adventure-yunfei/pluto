import React from 'react';
import {connect} from 'react-redux';
import Component from 'react-pure-render/component';

import setActionToString from 'yfjs/lib/redux-utils/setActionToString';
import reducer from 'react-2048/lib/reducer';
import _Game2048 from 'react-2048/lib/Game2048';
import {setPiecesAction, setScoreAction} from 'react-2048/lib/actions';
import Favicon from '../components/Favicon';

setActionToString('game2048', {
    setPiecesAction,
    setScoreAction
});

@connect((state) => ({
    pieces: state.getIn(['game2048', 'pieces']),
    score: state.getIn(['game2048', 'score'])
}))
class Game2048Wrapper extends Component {
    render() {
        return (
            <div>
                <Favicon href="/static/favicon-2048.ico"/>
                <_Game2048 {...this.props}/>
            </div>
        );
    }
}

export {Game2048Wrapper as Game2048, reducer};
