function createElement(obj) {
    'use strict';
    if (Array.isArray(obj)) {

        return obj.reduce(function (f, el) {
            f.append(createElement(el));

            return f;
        }, document.createDocumentFragment());
    }

    if (typeof obj === 'string') {
        return document.createTextNode(obj);
    }

    const el = document.createElement(obj.tag);

    if (obj.cls) {
        el.className = obj.cls;
    }
    if (obj.styles) {
        Object.assign(el.style, obj.styles);
    }
    if (obj.attrs) {
        Object.keys(obj.attrs).forEach((key) => el.setAttribute(key, obj.attrs[key]));
    }
    if (obj.childs) {
        el.appendChild(createElement(obj.childs));
    }

    return el;
}