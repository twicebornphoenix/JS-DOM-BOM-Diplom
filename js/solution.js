'use strict';

class App {
    constructor(node) {
        this.node = node;
        this.menu = this.createElement(menuTmpl());
    }
    createElement(obj) {
        if (Array.isArray(obj)) {
            return obj.reduce((f, el) => {
                f.append(this.createElement(el));

                return f;
            }, document.createDocumentFragment());
        }
        if (typeof obj === 'string') return document.createTextNode(obj)
        const el = document.createElement(obj.tag);
        [].concat(obj.cls || []).forEach(clsName => el.classList.add(clsName));

        if (obj.attrs) Object.keys(obj.attrs).forEach(key => el.setAttribute(key, obj.attrs[key]));
        if (obj.childs) el.appendChild(this.createElement(obj.childs));

        return el;
    }
    waiting() {
        this.setMenuEventListeners();
        this.setAppAreaEventListeners();
    }
    activateCurrentState(st) {
        const stateObj = JSON.parse(st);
        this.activateMenuState(stateObj.menuView);
    }
    start() {
        this.activateCurrentState(this.state);
        this.node.appendChild(this.menu);
        this.waiting();
    }
}


const app = new App(document.getElementsByClassName('app')[0]);
app.start();
