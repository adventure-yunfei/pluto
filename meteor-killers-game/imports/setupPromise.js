import { Meteor } from 'meteor/meteor';
import Promise from 'beauty-promise';

if (Meteor.isClient) {
    window.Promise = Promise;
    Promise.onUnhandledRejection = reason => {
        let errMsg = '';
        if (typeof reason === 'string') {
            errMsg = reason;
        } else if (reason && typeof reason.error === 'string') {
            errMsg = reason.error 
        } else if (reason && typeof reason.reason === 'string') {
            errMsg = reason.reason;
        } else if (reason && typeof reason.message === 'string') {
            errMsg = reason.message;
        }
        alert(errMsg || (reason && reason.toString()) || 'Unknown error occured...');
    };
}
if (Meteor.isServer) {
    global.Promise = Promise;
}
