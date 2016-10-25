define(function () {
    /**
     * @returns {{move: *, score: int}}
     * @private */
    function doCalculate(stepsLeft, isFirstPlayer, score, status) {
        var bestRes = null,
            me = this;
        if (stepsLeft > 0) {
            (this.availableMoves || this.getAvailableMoves(isFirstPlayer, status)).forEach(function (m) {
                var moveRes = me.fnMove(isFirstPlayer, m, score, status && status.clone());
                if (moveRes) {
                    var finalScore = doCalculate.apply(me, [ stepsLeft - 1, !isFirstPlayer, moveRes.score, moveRes.status ]).score;
                    if (bestRes === null || (isFirstPlayer ? (finalScore > bestRes.score) : (finalScore < bestRes.score))) {
                        bestRes = {
                            move: m,
                            score: finalScore
                        };
                    }
                }
            });
        }
        return bestRes || {move: null, score: score};
    }

    /**
     * @mixin minimax
     */
    return {
        availableMoves: null,
        getAvailableMoves: null,

        fnMove: null,

        /** Do the calculation
         * @param {int} stepsToConsider How many steps that this calculation needs to consider
         * @param {Array|Function} availableMoves All of the movements that player1 or player2 can do. Could each be a function to return an array, called as getAvailableMoves(isFirstPlayer, currentStatus)
         * @param {Function} fnMove Function to do the movement and return score & status. Called as fnMove(isFirstPlayer, move, currentScore, currentStatus), returned as {score: int, status: *} or null if cannot move
         * @param {int} score
         * @param {*} status Any data represents status, but must contain "clone" function which copy itself
         * @returns * The best movement */
        calculateNextMove: function calculateNextMove(stepsToConsider, availableMoves, fnMove, score, status) {
            this[(typeof availableMoves === "function") ? 'getAvailableMoves' : 'availableMoves'] = availableMoves;
            this.fnMove = fnMove;
            return doCalculate.apply(this, [ stepsToConsider, true, score, status ]).move;
        }
    };
});