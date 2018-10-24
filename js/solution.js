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
    get state() {
        if (!sessionStorage.getItem('currentState')) sessionStorage.setItem('currentState', this.firstStart());
        return sessionStorage.getItem('currentState');
    }
    set state(st) {
        sessionStorage.setItem('currentState', st);
    }
    firstStart() {
        return JSON.stringify({
            state: 'publish',
            mode: null,
            menuView: {
                dataState: 'initial',
                selected: null,
                burger: {
                    display: 'none'
                }
            },
            comments: null,
            canvas: null
        });
    }
    activateMenuState(st) {
        this.menu.dataset.state = st.dataState;
        this.menu.children[1].style.display = st.burger.display;
    }
    setMenuEventListeners() {
        this.menu.addEventListener('click', e => {
            const target = e.target;
            if (target.classList.contains('new')) this.handleFileSelect();
        });
    }
    handleFileSelect() {
        const input = document.createElement('input');
        input.id = 'files';
        input.type = 'file';
        input.accept = 'image/jpeg, image/png';
        // input.addEventListener('change', connection.onupload)

        this.node.appendChild(input);
        input.style.display = 'none';

        const ev = document.createEvent('MouseEvents');
        ev.initMouseEvent('click');
        input.dispatchEvent(ev);

        this.node.removeChild(input)
    }
    waiting() {
        this.setMenuEventListeners();
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