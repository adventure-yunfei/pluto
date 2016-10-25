define({
    randInt: function randInt(start, end) {
        var size = end - start + 1;
        return Math.floor(Math.random() * size) + start;
    },

    xor: function xor(a, b) {
        return a ? !b : !!b;
    }
});