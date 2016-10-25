requirejs.config({
    baseUrl: '/', // Set 'baseUrl' to 'WebContent' folder
    paths: {
        cm: 'common/js',
        jClass: 'common/js/jClass',
        plugins: 'common/plugins',
        jquery: 'common/plugins/jquery-1.11.2',
        hogan: 'common/plugins/hogan-3.0.1',
        react: 'common/plugins/react-0.13.3/build/react'
    }
});

if (typeof DEBUG === 'undefined') {
    DEBUG = true;
    jcAssert = function jcAssert(condition, errorMessage) {
        if (!condition) {
            throw new Error(errorMessage);
        }
    };
}