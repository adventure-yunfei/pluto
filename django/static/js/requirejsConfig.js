requirejs.config({
    baseUrl: '/static', // Set 'baseUrl' to 'static' folder
    packages: [{
        name: '$a',
        location: 'js',
        main: 'adventure'
    }, {
        "name": "jClass",
        "location": "node_modules/javascript-class",
        "main": "jClass"
    }]
});
