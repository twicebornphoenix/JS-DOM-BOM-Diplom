'use strict';

const app = {
    wrap: document.body.appendChild( createElement(appWrapTmpl()) ),
    commentsMap: new Map(),

    createMenu: function() {
        const menu = {
            el: this.wrap.appendChild( createElement(menuTmpl()) )
        };
    },
    moveMenu: function () {},
    clear: function() {}
}

app.createMenu();