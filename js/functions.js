'use strict';

function startApp() {
    
}


function createElement(obj) {
        if (Array.isArray(obj)) {
            return obj.reduce((f, el) => {
                f.append(this.createElement(el));

                return f;
            }, document.createDocumentFragment());
        }
        const el = document.createElement(obj.tag);

        if (obj.cls) el.className = obj.cls;
        if (obj.attrs) Object.keys(obj.attrs).forEach(key => el.setAttribute(key, obj.attrs[key]));
        if (obj.childs) el.appendChild(this.createElement(obj.childs));

        return el;
}