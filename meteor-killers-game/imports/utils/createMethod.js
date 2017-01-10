import { ValidatedMethod } from 'meteor/mdg:validated-method';

export default function createMethod(options) {
    const method = new ValidatedMethod(options);
    return function promisedMethod(arg) {
        return new Promise((resolve, reject) => {
            method.call(arg, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    };
}
