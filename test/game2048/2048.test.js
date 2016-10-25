var immutable = require('immutable'),
    getMoveResult = require('./game2048.es5').getMoveResult,
    lodash = require('lodash');

function removeUIDAndEmpty(state) {
    return state.update('pieces', function (pieces) {
        return pieces.map(function (p) {
            return p ? p.delete('uid') : null;
        });
    });
}

describe('Test game 2048', function () {
    it('first example test', function () {
        var initialState = null;
        return browser
            .url('localhost:3000/2048')
            .execute(function () {
                return {
                    state: window.store.getState().toJS().game2048
                };
            })
            .then(function (result) {
                initialState = immutable.fromJS(lodash.pick(result.value.state, ['pieces', 'score']));
            })
            .click('.AutoPlay.button')
            .pause(1000)
            .click('.AutoPlay.button')
            .pause(300)
            .execute(function () {
                return {
                    state: window.store.getState().toJS().game2048,
                    moves: window.moves,
                    newPieces: window.newPieces
                };
            })
            .then(function (result) {
                var value = result.value,
                    finalState = immutable.fromJS(lodash.pick(value.state, ['pieces', 'score'])),
                    moves = value.moves,
                    newPieces = value.newPieces;
                moves.forEach(function (m, idx) {
                    var moveRes = getMoveResult({
                        pieces: initialState.get('pieces'),
                        score: initialState.get('score'),
                        size: 4,
                        direction: m
                    });
                    initialState = immutable.fromJS({
                        pieces: moveRes.pieces,
                        score: moveRes.score
                    });
                    lodash.forEach(newPieces[idx], function (p, pos) {
                        initialState = initialState.update('pieces', function (pieces) {
                            return pieces.set(pos, immutable.fromJS(p));
                        });
                    })
                });

                console.log(removeUIDAndEmpty(initialState).toJS());
                console.log(removeUIDAndEmpty(finalState).toJS());
                return immutable.is(removeUIDAndEmpty(initialState), removeUIDAndEmpty(finalState));
            }).should.eventually.be.equal(true);
    });
});
