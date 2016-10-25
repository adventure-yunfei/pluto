define(['$a/BaseHelper', '$a/algorithm/minimax', '$a/math', 'jClass'], function (BaseHelper, minimax, math, jClass) {
    var MOVES = ['u', 'r', 'd', 'l'],
        KEY_SPACE = 32;
    /**
     * Class for auto-play 2048 game
     * @class game2048.game2048_Player
     * @extends BaseHelper
     */
    return jClass.declare(BaseHelper, null, {
        helperClass: 'game2048.game2048_Player',

        /** Helper for the game2048
         *  @type game2048.game2048 */
        game2048: null,

        /** Step to pre-calculate when the auto-player determines the next movement
         * Consider only the steps of auto-player, so it's (calculateSteps * 2 - 1) total steps for minimax algorithm
         * @default 1
         * @type int */
        calculateSteps: 1,

        $constructor: function constructor(node, props) {
            this.$super(node, props);
            this.autoPlayNode = this.find('.AutoPlay')[0];
            this.randomAutoPlayNode = this.find('.RandomAutoPlay')[0];
            this.on('.AutoPlay', 'click', this.toggleAutoPlay);
            this.on('.RandomAutoPlay', 'click', this.toggleRandomAutoPlay);
            this.on('.AutoPlayOnSpaceKey', 'click', this.playOnSpaceKey);
        },

        /** Toggle between Automatically continue playing and stop */
        toggleAutoPlay: function toggleAutoPlay() {
            var me = this;
            this._autoPlayOn = !this._autoPlayOn;
            $(this.autoPlayNode).text(this._autoPlayOn ? 'Stop Auto-Play Game' : 'Auto-Play Game');
            (function continuePlay() {
                if (me._autoPlayOn) {
                    me.game2048.playAMove(me.calculateNextMove());
                    window.setTimeout(continuePlay, 200);
                }
            }());
        },

        toggleRandomAutoPlay: function toggleRandomAutoPlay() {
            var me = this;
            this._randomAutoPlayOn = !this._randomAutoPlayOn;
            $(this.randomAutoPlayNode).text(this._randomAutoPlayOn ? 'Stop Random Auto-Play' : 'Random Auto-Play without Algorithm');
            (function continueRandomPlay() {
                if (me._randomAutoPlayOn) {
                    me.game2048.playAMove(MOVES[math.randInt(0, 3)]);
                    window.setTimeout(continueRandomPlay, 200);
                }
            }());
        },

        /** Play one move when SPACE key down */
        playOnSpaceKey: function playOnSpaceKey() {
            var me = this;
            if (!this._playOnSpace) {
                $(document).on('keydown', function (evt) {
                    me._playOnSpace = true;
                    if (evt.keyCode === KEY_SPACE) {
                        me.game2048.playAMove(me.calculateNextMove());
                    }
                });
            }
        },

        /** Calculate next movement by minimax algorithm */
        calculateNextMove: function calculateNextMove() {
            var game2048 = this.game2048,
                oldSquares = game2048.squares,
                fnStatusClone = function () {
                    return {
                        clone: this.clone,
                        squaresNoNode: this.squaresNoNode.map(function (sq) {
                            return {
                                pos: sq.pos,
                                num: sq.num,
                                action: ''
                            };
                        })
                    };
                },
                clonedStatus = {
                    squaresNoNode: oldSquares,
                    clone: fnStatusClone
                }.clone(),
                movement = minimax.calculateNextMove(this.calculateSteps * 2 - 1, this.getAvailableMovesFunc(), this.getFnMoveFunc(), game2048.score, clonedStatus);
            // First reset squares back
            game2048.squares = oldSquares;
            return movement;
        },

        /** Generate the function getAvailableMoves for minimax
         * @returns {Function} */
        getAvailableMovesFunc: function getAvailableMovesFunc() {
            var game2048 = this.game2048;
            return function getAvailableMoves(isPlayer, status) {
                var moves = MOVES;
                if (!isPlayer) {
                    var oldSquares = game2048.squares;
                    game2048.squares = status.squaresNoNode;
                    moves = game2048.getEmptyPositions();
                    game2048.squares = oldSquares;
                }

                return moves;
            };
        },

        /** Generate the functino fnMove for minimax
         * NOTE it only considers that new square number will always be 2 (no 4)
         * @returns {Function} */
        getFnMoveFunc: function getFnMoveFunc() {
            var game2048 = this.game2048;
            return function fnMove(isPlayer, move, score, status) {
                var squares = status.squaresNoNode;
                game2048.score = score;
                game2048.squares = squares;
                if (isPlayer) {
                    var moved = game2048.move(move);
                    if (!moved) {
                        return null;
                    }
                } else {
                    // Only consider that new square number is 2
                    game2048.popNewSquareInPos(move, 2);
                }

                // Cannot directly call game2048.renderSquaresAndScore, cause it's for dom animation
                // So here handle the data manually
                var i = 0;
                while (i < squares.length) {
                    var sq = squares[i],
                        action = sq.action;
                    // Contains DISAPPEAR?
                    if (action.indexOf('d') !== -1) {
                        squares.splice(i, 1);
                        i--;
                        // Contains DOUBLE?
                    } else if (action.indexOf('D') !== -1) {
                        game2048.score += sq.num = sq.num * 2;
                    }
                    sq.action = '';
                    i++;
                }

                return {
                    score: game2048.score,
                    status: status
                };
            };
        }
    });
});
