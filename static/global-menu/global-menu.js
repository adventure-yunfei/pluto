(function () {
    /*globalConfig_placeholder*/

    var cls = 'global-menu',
        animateDuration = 2000;

    /**@param {{cls, href, text}} config*/
    function createAnchor(config) {
        var anchorNode = document.createElement('a');
        anchorNode.className = config.cls;
        anchorNode.href = config.href;
        anchorNode.textContent = config.text;
        return anchorNode;
    }
    function createDiv(cls) {
        var divNode = document.createElement('div');
        divNode.className = cls;
        return divNode;
    }

    var hosts = globalConfig.hosts,
        defaultMenus = [{
            text: 'React',
            host: '//' + hosts.react.by_domain,
            subMenus: [{
                text: '摄影',
                href: '/'
            }, {
                text: '2048',
                href: '/2048'
            }, {
                text: '关于',
                href: '/about'
            }]
        }, {
            text: '博客',
            href: '//' + hosts.gitblog.by_domain,
        }, {
            text: 'Github',
            href: 'https://github.com/adventure-yunfei',
        }, {
            text: 'ElasticSearch Log',
            href: '//' + hosts.kibana.by_domain,
        }, {
            text: 'Django',
            host: '//' + hosts.django.by_domain,
            deprecated: true,
            subMenus: [{
                text: '摄影',
                href: '/'
            }, {
                text: '2048',
                href: '/2048'
            }, {
                text: '关于',
                href: '/about'
            }]
        }],
        getMenuNode = function () { return document.querySelector('.' + cls); },
        getTogglerNode = function () { return document.querySelector('.global-menu-toggler'); },
        checkAndHideMenu = function (e) {
            if (!getMenuNode().contains(e.target)) {
                globalMenu.hide();
            }
        },

        setupToggler = function () {
            var createTriangle = function (cls) {
                    var triangle = createDiv(cls);
                    triangle.appendChild(createDiv('line line-1'));
                    triangle.appendChild(createDiv('line line-2'));
                    triangle.appendChild(createDiv('line line-3'));
                    return triangle;
                },
                togglerNode = getTogglerNode();
            togglerNode.appendChild(createTriangle('outer-triangle'));
            togglerNode.appendChild(createTriangle('outer-triangle-shadow'));
            togglerNode.appendChild(createTriangle('inner-triangle'));
            togglerNode.appendChild(createTriangle('inner-triangle-shadow'));
            togglerNode.classList.add('fancy-triangle');
        },

        setupMenus = function () {
            var menuContainerNode = createDiv(cls);

            defaultMenus.forEach(function (rootMenu) {
                var rootMenuNode = createDiv('root-menu-container ' + (rootMenu.deprecated ? 'deprecated' : '')),
                    subMenuContainerNode = createDiv('sub-menus-container');
                rootMenuNode.appendChild(createAnchor({
                    cls: 'global-menu-item root-menu',
                    href: rootMenu.href ? (rootMenu.host || '') + rootMenu.href : 'javascript:void(0)',
                    text: rootMenu.text
                }));

                (rootMenu.subMenus || []).forEach(function (subMenu) {
                    subMenuContainerNode.appendChild(createAnchor({cls: 'global-menu-item', href: (rootMenu.host || '') + subMenu.href, text: subMenu.text}));
                });

                rootMenuNode.appendChild(subMenuContainerNode);
                menuContainerNode.appendChild(rootMenuNode);
            });

            document.body.appendChild(menuContainerNode);
            getTogglerNode().addEventListener('click', function () {
                globalMenu.animateToggler();
                globalMenu.show();
            });
        },

        globalMenu = {
            animateToggler: function () {
                var classList = getTogglerNode().classList;
                if (!classList.contains('animate')) {
                    classList.add('animate');
                    setTimeout(function () {
                        classList.remove('animate');
                    }, animateDuration);
                }
            },

            show: function () {
                getMenuNode().classList.add('show-menu');
                setTimeout(function () {
                    window.addEventListener('click', checkAndHideMenu);
                }, 10);
            },

            hide: function () {
                getMenuNode().classList.remove('show-menu');
                window.removeEventListener('click', checkAndHideMenu);
            }
        };

    setupMenus();
    setupToggler();
    window.addEventListener('load', globalMenu.animateToggler);
    window.globalMenu = globalMenu;
}());
