define(['$a/BaseHelper', '$a/array', '$a/dom', 'jClass'], function (BaseHelper, array, dom, jClass) {
    /** Square action */
    var DISAPPEAR = 'd',
        APPEAR = 'a',
        DOUBLE = 'D',
        MOVE = 'm';
    /** Direction */
    var UP = 'u',
        RIGHT = 'r',
        DOWN = 'd',
        LEFT = 'l';
    var key2direction = {
            37: LEFT,
            38: UP,
            39: RIGHT,
            40: DOWN
        },
        squareSize = 100;               // Square node size (pixel)

    function sqNumCls(sqNum) {
        return 'num' + sqNum;
    }

    function getSquareMatrix(squares) {
        var sqMatrix = [];
        $.each(squares, function (idx, sq) {
            sqMatrix[sq.pos] = sq;
        });
        return sqMatrix;
    }

    function getSquareNodePosCss(game2048, square) {
        var coord = game2048._i2rc(square.pos);
        return {
            top: (coord.row * squareSize) + 'px',
            left: (coord.col * squareSize) + 'px'
        };
    }

    function animateOnce(jqNode, animateName, animateEndHandler) {
        var cssCls = 'animated ' + animateName;
        jqNode.addClass(cssCls)
            .one(dom.animateEvtName.END, function () {
                jqNode.removeClass(cssCls);
                if (animateEndHandler) {
                    animateEndHandler();
                }
            });
    }

    /**@class game2048.game2048
     * @extends BaseHelper */
    return jClass.declare(BaseHelper, null, {
        helperClass: 'game2048.game2048',

        /** Size of the 2048 table row/column.
         * @type int */
        size: 4,
        /** Record current squares in the 2048 table
         * @type Array.<{num: int, pos: int, node: HTMLElement|undefined, action: string, doubling: boolean|undefined}> */
        squares: null,
        /** @type int */
        score: 0,

        $constructor: function constructor(node, props) {
            this.$super(node, props);
            this.squaresNode = this.find('.squaresContainer');
            this.squares = [];
            this.randomPopNewSquare();
            this.randomPopNewSquare();
            this.renderSquaresAndScore();

            var me = this;
            // Bind 'keydown' to play game with direction keys
            $(document).on('keydown', function (evt) {
                var direction = key2direction[evt.keyCode];
                if (direction) {
                    me.playAMove(direction);
                }
            });
        },

        /** Try to move to direction, and then pop new square, render the result */
        playAMove: function (direction) {
            var moved = this.move(direction);
            if (moved) {
                this.randomPopNewSquare();
                this.renderSquaresAndScore();
            }

        },

        /** Process squares actions to render the updated result */
        renderSquaresAndScore: function renderSquaresAndScore() {
            var me = this,
                squares = this.squares,
                i = 0,
                getFnRemoveNode = function (jqNode) {
                    return function () {
                        jqNode.remove();
                    };
                },
                getFnDoubleEffect = function (oldNum, newNum, jqNode) {
                    return function () {
                        jqNode.removeClass(sqNumCls(oldNum))
                            .addClass('noTransition ' + sqNumCls(newNum))
                            .text(newNum);
                        window.setTimeout(function () {
                            jqNode.removeClass('noTransition');
                        });
                        // 闪烁合并后的方块
                        animateOnce(jqNode, 'pulse');
                        // 更新分数显示
                        me.find('#score > span').text(me.score);
                    };
                };
            while (i < squares.length) {
                var step = 1,
                    sq = squares[i],
                    act = sq.action,
                    ai,
                    jqNode = $(sq.node);
                for (ai = 0; ai < act.length; ai++) {
                    switch (act[ai]) {
                    case DISAPPEAR:
                        animateOnce(jqNode, 'directDisappear', getFnRemoveNode(jqNode));
                        squares.splice(i, 1);
                        step = 0;
                        break;
                    case APPEAR:
                        jqNode = $(document.createElement('div'))
                            .text(sq.num)
                            .css(getSquareNodePosCss(this, sq))
                            .addClass('square ' + sqNumCls(sq.num));
                        animateOnce(jqNode, 'bounceIn');
                        sq.node = jqNode[0];
                        jqNode.appendTo(this.squaresNode);
                        break;
                    case DOUBLE:
                        var sqOldNum = sq.num;
                        sq.num = sqOldNum * 2;
                        sq.doubling = undefined;
                        this.score += sq.num;
                        jqNode.one(dom.transitionEvtName.END, getFnDoubleEffect(sqOldNum, sq.num, jqNode));
                        break;
                    case MOVE:
                        var newPos = getSquareNodePosCss(this, sq),
                            changedProps = ['top', 'left'].filter(function (prop) {
                                return (newPos[prop] !== jqNode[0].style[prop]);
                            });
                        $a.assert(changedProps.length === 1, 'Both top and left of this square is changed!');
                        jqNode.css(changedProps[0], newPos[changedProps[0]])
                            .toggleClass('changingTop', changedProps[0] === 'top')
                            .toggleClass('changingLeft', changedProps[0] === 'left');
                        break;
                    }
                }

                // Clear action flag after render
                sq.action = '';

                i += step;
            }
        },

        /** Randomly fill a number (2 or 4) in 2048 table */
        randomPopNewSquare: function randomPopNewSquare() {
            var emptyPos = this.getEmptyPositions(),
                newPos = emptyPos[Math.floor(Math.random() * emptyPos.length)],
                newNum = 2;// TODO: Math.random() < 0.9 ? 2 : 4;
            this.popNewSquareInPos(newPos, newNum);
        },

        /** Pop a new square with given number in given position
         * @param {int} pos Index in the size * size matrix
         * @param {int} num Number for new square */
        popNewSquareInPos: function (pos, num) {
            this.squares.push({
                pos: pos,
                num: num,
                action: APPEAR
            });
        },

        /** Get the empty positions in the size * size matrix
         * @returns {Array.<int>} */
        getEmptyPositions: function () {
            var emptyPos = [],
                sqMatrix = getSquareMatrix(this.squares),
                len = this.size * this.size,
                i;
            for (i = 0; i < len; i++) {
                if (!sqMatrix[i]) {
                    emptyPos.push(i);
                }
            }
            return emptyPos;
        },

        _rc2i: function _rc2i(row, col) {
            return row * this.size + col;
        },
        _i2rc: function _i2rc(i) {
            var size = this.size;
            return {
                row: Math.floor(i / size),
                col: i % size
            };
        },

        /** Move 2048 squares to specified direction
         * Note it only process the data to be binded with some actions, not affect the rendered dom
         * @param {string} direction
         * @return {boolean} Whether moved successfully
         */
        move: function move(direction) {
            var size = this.size,
                sqMatrix = getSquareMatrix(this.squares),
                hasMoved = false,   // Whether there's a movement
                isHorizon = direction === LEFT || direction === RIGHT,
                isPositive = direction === RIGHT || direction === DOWN,
                step = isPositive ? 1 : -1, // Step that controls square movement direction
                scanStep = -step,           // Step that controls scan direction
                me = this,
                getPos = function (_a1, _a2) {
                    return isHorizon ? me._rc2i(_a1, _a2) : me._rc2i(_a2, _a1);
                },
                a1;
            // Scan each square
            for (a1 = 0; a1 < size; a1++) {
                var a2 = isPositive ? size - 1 : 0;
                while (0 <= a2 && a2 < size) {
                    // Do moving for one square
                    var sqPos = getPos(a1, a2), // Original square position
                        sq = sqMatrix[sqPos];   // Original square
                    if (sq) {
                        var sqNum = sq.num,     // Original square number
                            sqNewA2 = a2 + step,// New axis two that the square will move to
                            sqThere;            // Existing square in new position
                        while (0 <= sqNewA2 && sqNewA2 < size && (!(sqThere = sqMatrix[getPos(a1, sqNewA2)]) || (!sqThere.doubling && sqThere.num === sqNum))) {
                            sqNewA2 += step;
                        }
                        sqNewA2 -= step;
                        if (sqNewA2 !== a2) {
                            var sqNewPos = getPos(a1, sqNewA2);
                            sqThere = sqMatrix[sqNewPos];
                            // Merge equal numbers
                            if (sqThere) {
                                sqThere.action += DISAPPEAR;
                                sq.action += DOUBLE;
                                sq.doubling = true;
                            }
                            // Move square to new position
                            sq.action += MOVE;
                            sq.pos = sqNewPos;
                            sqMatrix[sqNewPos] = sq;
                            sqMatrix[sqPos] = undefined;
                            hasMoved = true;
                        }
                    }

                    // Increase to scan next square
                    a2 += scanStep;
                }
            }

            return hasMoved;
        }
    });
});
