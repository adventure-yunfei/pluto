'use strict';

/**此文件由 Game2048.js 转码为 ES5 */

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getMoveResult = getMoveResult;
var immutable = require('immutable'),
    List = immutable.List;
var UP = 'u',
    RIGHT = 'r',
    DOWN = 'd',
    LEFT = 'l';
var lastId = 0;
function getUID() {
    var uid = Date.now();
    if (uid <= lastId) {
        uid = lastId + 1;
    }
    lastId = uid;
    return uid;
}
var getNewPiece = exports.getNewPiece = function getNewPiece(num) {
    var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var _ref$doubled = _ref.doubled;
    var doubled = _ref$doubled === undefined ? false : _ref$doubled;
    return immutable.fromJS({
        uid: getUID(),
        num: num,
        doubled: doubled
    });
};

/** 坐标转换: 行/列 转 单索引 */
var rc2i = function rc2i(size, row, col) {
    return row * size + col;
};
/** 坐标转换: 单索引 转 行/列 */
var i2rc = function i2rc(size, i) {
    return {
        row: Math.floor(i / size),
        col: i % size
    };
};

function getMoveResult(_ref2) {
    var pieces = _ref2.pieces;
    var score = _ref2.score;
    var size = _ref2.size;
    var direction = _ref2.direction;


    var hasMoved = false,
        hasDoubling = false,
        isHorizon = direction === LEFT || direction === RIGHT,
        isPositive = direction === RIGHT || direction === DOWN,
        step = isPositive ? 1 : -1,
        // Step that controls square movement direction
    scanStep = -step,
        // Step that controls scan direction
    getPos = function getPos(_a1, _a2) {
        return isHorizon ? rc2i(size, _a1, _a2) : rc2i(size, _a2, _a1);
    };

    // Scan each square
    for (var a1 = 0; a1 < size; a1++) {
        var a2 = isPositive ? size - 1 : 0;
        while (0 <= a2 && a2 < size) {
            // Do moving for one square
            var pPos = getPos(a1, a2),
                // Original piece position
            piece = pieces.get(pPos); // Original piece
            if (piece) {
                var pNum = piece.get('num'),
                    // Original square number
                pNewA2 = a2 + step,
                    // New axis two that the square will move to
                existedPieceThere = void 0; // Existing square in new position
                while (0 <= pNewA2 && pNewA2 < size && (!(existedPieceThere = pieces.get(getPos(a1, pNewA2))) || !(existedPieceThere instanceof List) && existedPieceThere.get('num') === pNum)) {
                    pNewA2 += step;
                }
                pNewA2 -= step;
                if (pNewA2 !== a2) {
                    var pNewPos = getPos(a1, pNewA2);
                    existedPieceThere = pieces.get(pNewPos);
                    pieces = pieces.set(pPos, null).set(pNewPos, existedPieceThere ? List([existedPieceThere, piece]) : piece);
                    hasMoved = true;
                    hasDoubling = hasDoubling || !!existedPieceThere;
                }
            }

            // Increase to scan next square
            a2 += scanStep;
        }
    }

    var finalPieces = !hasDoubling ? pieces : pieces.map(function (piece) {
        if (piece && piece instanceof List) {
            var newNum = piece.get(0).get('num') * 2;
            score += newNum;
            return getNewPiece(newNum, { doubled: true });
        } else {
            return piece;
        }
    });

    return {
        hasMoved: hasMoved,
        hasDoubling: hasDoubling,
        score: score,
        pieces: finalPieces,
        movingPieces: pieces
    };
}
