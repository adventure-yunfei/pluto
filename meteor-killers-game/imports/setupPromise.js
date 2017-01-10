// Promise
Promise.prototype.finally = (function () {
    return function promiseFinally(handler) {
        const execHandler = () => {
            try {
                handler();
            } catch (e) {
                setTimeout(() => {
                    throw e;
                }, 0);
            }
        };
        this.then((value) => {
            execHandler();
            return value;
        }, (reason) => {
            execHandler();
            return Promise.reject(reason);
        });

        return Promise.resolve(this);
    }
})();

window.onunhandledrejection = event => {
    const {reason} = event;
    let errMsg = '';
    if (typeof reason.error === 'string') {
        errMsg = reason.error 
    } else if (typeof reason.reason === 'string') {
        errMsg = reason.reason;
    } else if (typeof reason.message === 'string') {
        errMsg = reason.message;
    }
    alert(errMsg || reason.toString());
};