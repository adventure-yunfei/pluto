Promise.prototype.finally = function (fn) { // eslint-disable-line no-extend-native
    return this.then(data => {
        fn();
        return data;
    }).catch(error => {
        fn();
        return Promise.reject(error);
    });
};
