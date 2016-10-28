declare var require: Function;
declare var globalMenu: any;

require('zepto');
const awesomeLetterAnimation: any = require('awesome-letter-animation');
const animejs: any = awesomeLetterAnimation.animejs;
const beianImg: string = require('./images/beian-icon.png');

require('normalize.css');
require('materialize-css/dist/css/materialize.css');
require('./index.less');

$(() => {
    const $beian = $('.beian-info'),
        $squares = $('.container'),
        $globalMenu = $('.global-menu-toggler');
    $beian
        .css('opacity', 0)
        .find('img')
        .attr('src', beianImg);
    $squares.css('opacity', 0);
    $globalMenu.css('opacity', 0);

    function adjustSvgSize() {
        const $body = $('body'),
            width = $body.width(),
            height = $body.height(),
            $svg = $('svg.logo-animator'),
            svgContentWidth = 600,
            svgContentHeight = 84;

        $svg.css('padding', `${(height-svgContentHeight)*0.4}px ${(width-svgContentWidth)/2} 0`);
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('logo-animator');
    document.body.appendChild(svg);    

    adjustSvgSize();
    window.onresize = adjustSvgSize;

    awesomeLetterAnimation('yunfei', svg, () => {
        animejs({
            targets: 'svg.logo-animator',
            scaleY: 0,
            duration: 1200,
            delay: 1500,

            complete() {
                animejs({
                    targets: $squares[0],
                    translateY: [100, 0],
                    opacity: 1,
                    duration: 1000,
                    easing: 'easeOutQuad',
                    delay: 0
                });

                animejs({
                    targets: $beian[0],
                    translateY: [50, 0],
                    opacity: 1,
                    duration: 1000,
                    easing: 'easeOutQuad',
                    delay: 1000
                });

                animejs({
                    begin() {
                        setTimeout(() => {
                            globalMenu.animateToggler();
                        }, 200);
                    },

                    targets: $globalMenu[0],
                    translateY: [-100, 0],
                    opacity: {
                        value: 1,
                        duration: 100
                    },
                    duration: 1000,
                    easing: 'easeOutBounce',
                    delay: 2500
                });
            }
        });
    });
});
