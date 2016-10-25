define(function () {
    return {
        animateEvtName: {
            START: 'animationstart webkitAnimationStart oanimationstart MSAnimationStart',
            ITERATION: 'animationiteration webkitAnimationIteration oanimationiteration MSAnimationIteration',
            END: 'animationend webkitAnimationEnd oanimationend MSAnimationEnd'
        },

        transitionEvtName: {
            END: 'transitionend webkitTransitionEnd otransitionend MSTransitionEnd'
        }
    };
});