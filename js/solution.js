'use strict';

function Worker() { 
    let centerX, centerY, maxX, maxY; 
    storage.dragStatus = false;

    function setDataState(cls, value, init = false) { 
        const burger = document.querySelector('.burger');
        if (value === 'default') {
            menu.dataset.state = value;

            return;
        };
        if (cls === '.burger') burger.style.display = value;
        document.querySelector(cls).dataset.state = value;
        menu.dataset.state = init || value;
    }

    function copyLinkToShare(e) { 
        navigator.clipboard.writeText(link_to_share.value)
            .then(successMessage)
            .catch((er) => console.log('something wrong'))
    }

    function successMessage() { 
        forUserInfo.children[0].textContent = 'Готово';
        forUserInfo.children[1].textContent = 'Ссылка скопирована в буфер обмена';
        menu.style.display = 'none';
        currentImage.style.display = 'none';
        forUserInfo.style.display = '';

        setTimeout(() => {
            forUserInfo.style.display = 'none';
            menu.style.display = '';
            currentImage.style.display = '';
        }, 1600)
    }

    function DnDselect(e) { 
        e.preventDefault();
        const [file] = e.dataTransfer.files;
        console.log(file.size, file.name, file.type)
        connection.onupload(file);
    }

    function handleFileSelect(e) { 
        const input = document.createElement('input');
        input.id = 'files';
        input.type = 'file';
        input.accept = 'image/jpeg, image/png';
        input.addEventListener('change', connection.onupload)

        workSpace.appendChild(input);
        input.style.display = 'none';

        const ev = document.createEvent('MouseEvents');
        ev.initMouseEvent('click');
        input.dispatchEvent(ev);

        workSpace.removeChild(input)
    }

    function calculateMenuCords() { 
        const menuCords = menu.getBoundingClientRect();
        storage.positionMenu = [menuCords.left, menuCords.top, menuCords.width];
    }

    function catchMenu(e) { 
        const menuCords = menu.getBoundingClientRect();
        const boodyCords = document.body.getBoundingClientRect();
        const aimCords = e.target.getBoundingClientRect();

        centerX = aimCords.width / 2;
        centerY = aimCords.height / 2;

        menu.style.top = menuCords.top + centerY;
        menu.style.left = menuCords.left + centerX;

        maxX = boodyCords.right - menuCords.width;
        maxY = boodyCords.bottom - menuCords.height;
        storage.dragStatus = true;
    }

    function formatDate(timestamp) {
        return new Date(timestamp).toLocaleString('ru-RU', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    this.createElement = function(obj) { 
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

    this.getCommentsBlockMessage = function(id, message, timestamp) {
        const messageDate = formatDate(timestamp);
        const messageBlock = worker.createElement(commentMessageBlockTmpl()); 

        messageBlock.setAttribute('id', id);
        messageBlock.querySelector('.comment__message').textContent = message;
        messageBlock.querySelector('.comment__time').textContent = messageDate.split(', ').join(' ');

        return messageBlock;
    }
    this.getCommentsForm = function(messageBlock, left, top) {
        const newForm = worker.createElement(commentsFormTmpl());
        connection.setListenersToForm(newForm);

        const newFormBody = newForm.querySelector('.comments__body');
        const placeBefore = newFormBody.querySelectorAll('.comment')[newFormBody.querySelectorAll('.comment').length - 1];

        newForm.querySelector('.loader').style.display = 'none';
        newFormBody.insertBefore(messageBlock, placeBefore); 

        newForm.style.left = `${left}px`; 
        newForm.style.top = `${top}px`

        workSpace.appendChild(newForm); 
        storage.currentComments.push(newForm);
    }
    this.changeViewMenu = function() {
        storage.mainState === 'comments' ? worker.changeStateAllMarks(false) : worker.changeStateAllMarks(true);
        Array.from(menu.children).forEach(item => item.dataset.state = '');
        setDataState('.burger', '');

        switch (storage.mainState) {
            case 'publish':
                setDataState('.burger', 'none', 'initial');
                break;
            case 'share':
                setDataState('.share', 'selected');
                break;
            case 'draw':
                setDataState('.draw', 'selected');
                break;
            case 'comments':
                setDataState('.comments', 'selected');
                break;
            case 'default':
                setDataState('.menu', 'default');
                break;
        }
    }
    this.changeStateAllMarks = function(value) { 
        const forms = Array.from(workSpace.querySelectorAll('form'));
        forms.forEach(form => {
            form.querySelector('.comments__marker-checkbox').disabled = value;
        })
    }
    this.removeAllCurrentComments = function() { 
        storage.currentComments.forEach(comment => {
            workSpace.removeChild(comment);
        })
    }
    this.moveMenu = function(e) { 
        if (!storage.dragStatus) return;

        let menuX = e.clientX - centerX;
        let menuY = e.clientY - centerY;

        menuX = Math.min(menuX, maxX);
        menuY = Math.min(menuY, maxY);
        menuX = Math.max(menuX, 0);
        menuY = Math.max(menuY, 0);

        menu.style.setProperty('--menu-top', `${menuY}px`);
        menu.style.setProperty('--menu-left', `${menuX}px`);
    }
    this.listenStateMenu = function() { 
        menu.addEventListener('click', e => {
            let target = e.target; 

            if (!(e.target.classList.contains('mode') || e.target.classList.contains('burger')))
                target = e.target.offsetParent; 

            if (target.classList.contains('new')) handleFileSelect(); 
            
            if (target.classList.contains('burger')) storage.mainState = 'default';
            if (target.classList.contains('comments')) storage.mainState = 'comments';
            if (target.classList.contains('draw')) storage.mainState = 'draw';
            if (target.classList.contains('share')) storage.mainState = 'share';
            if (target.classList.contains('draw-tools')) drawer.changeColor(e);
        });

        menu.querySelector('.menu_copy').addEventListener('click', copyLinkToShare);
        menu.querySelector('.menu__toggle-bg').addEventListener('change', connection.showOrhideComments); 
        menu.addEventListener('mousemove', calculateMenuCords); 

        document.querySelector('.drag').addEventListener('mousedown', catchMenu);
        document.addEventListener('mousemove', worker.moveMenu);
        document.addEventListener('mouseup', e => storage.dragStatus = false);
    }
    this.listenLoadFile = function() { // слушаем события загрузки файла
        workSpace.addEventListener('dragover', e => e.preventDefault());
        workSpace.addEventListener('drop', DnDselect);
    }
}

function Storage() { 
    Object.defineProperties(this, {
        mainState: { 
            get: function() {
                return sessionStorage.getItem('currentState');
            },
            set: function(newV) {
                const currentAppState = newV;
                sessionStorage.setItem('currentState', newV);
                worker.changeViewMenu();
            }
        },
        positionMenu: { 
            set: function(cords) {
                if (this.dragStatus) {

                    sessionStorage.setItem('x, y', cords);
                    menu.style.display = ''
                }
            },
            get: function() {
                if (sessionStorage.getItem('x, y')) {
                    let [x, y] = sessionStorage.getItem('x, y').split(',');

                    menu.style.setProperty('--menu-left', `${x}px`);
                    menu.style.setProperty('--menu-top', `${y}px`);
                }
                menu.style.display = ''
            }
        },
        dragStatus: { 
            set: function(newVal) {
                this.currentDragStatus = newVal;
            },
            get: function() {
                return this.currentDragStatus;
            }
        }
    });
    this.initialization = function() { 
        storage.mainState = 'publish';
        currentImage.classList.add('current-image');
        return workSpace.insertBefore(currentImage, forUserInfo)
    }
    this.start_with_image = function() { 
        currentImage.classList.add('current-image');
        storage.mainState = sessionStorage.getItem('currentState');
        currentImage.src = sessionStorage.getItem('currentImage');

        link_to_share.setAttribute('value', `${window.location.origin}${window.location.pathname}?${sessionStorage.getItem('currentId')}`);
        currentImage.addEventListener('load', drawer.calculateCanvasSize);
        storage.positionMenu;

        connection.getCurrentInfo(sessionStorage.getItem('currentId'));
        connection.startWebSocketConnect(sessionStorage.getItem('currentId'));

        return workSpace.insertBefore(currentImage, forUserInfo);
    }
    this.setCurrentInfo = function(url) { 
        currentImage.classList.add('current-image');
        currentImage.src = url;
        
        currentImage.addEventListener('load', drawer.calculateCanvasSize);

        storage.mainState = 'comments';
        imageLoader.style.display = 'none';
        menu.style.display = '';

        sessionStorage.setItem('currentImage', url);
        link_to_share.setAttribute('value', `${window.location.origin}${window.location.pathname}?${sessionStorage.getItem('currentId')}`);
        workSpace.insertBefore(currentImage, forUserInfo);
    }
    this.currentComments = []; 
}

function Connection() { 
    const alertMessages = [
        'Чтобы загрузить новое изображение, пожалуйста, воспользуйтесь пунктом "Загрузить новое" в меню',
        'Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png',
        'Произошла внутрення ошибка. Обратитесь к вашему системному администратору'
    ]

    function fillFormHandle(data) {  
        const formToFill = Array.from(workSpace.querySelectorAll('form')).find(form => form.querySelector('.comments__marker-checkbox').checked);
        const messageBlock = worker.getCommentsBlockMessage(data.id, data.message, data.timestamp);      
        const placeForPost = formToFill.querySelectorAll('.comment')[formToFill.querySelectorAll('.comment').length - 1];
        const bodyComment = formToFill.querySelector('.comments__body');  
        placeForPost.before(messageBlock);
    }
    
    function fillFormServ(data) {
        const comments = Object.entries(data.comments);
        comments.forEach(comment => {
            distribCommentsContent(comment);
        })

        function getLastElement(parent, cls) {
            return parent.querySelectorAll(`.${cls}`)[parent.querySelectorAll(`.${cls}`).length - 1];
        }

        function distribCommentsContent(comment) {
            let [id, { left, top, timestamp, message }] = comment;
            const messageBlock = worker.getCommentsBlockMessage(id, message, timestamp);
            distribFormCords(messageBlock, left, top);
        }

        function distribFormCords(messageBlock, left, top) {
            const commentsFormOnImageArea = Array.from(workSpace.querySelectorAll('form'));
            if (!commentsFormOnImageArea.length) {
                const newForm = worker.getCommentsForm(messageBlock, left, top);
            } else {
                const commentsForm = commentsFormOnImageArea
                    .find(form => parseInt(form.style.left) === Math.floor(left) && parseInt(form.style.top) === Math.floor(top));
                if (commentsForm) {
                    const commentsFormBody = commentsForm.querySelector('.comments__body');
                    const placeBefore = getLastElement(commentsFormBody, 'comment');
                    commentsFormBody.insertBefore(messageBlock, placeBefore);
                } else {
                    const newCommentsForm = worker.createElement(commentsFormTmpl());
                    connection.setListenersToForm(newCommentsForm);
                    const newCommentsFormBody = newCommentsForm.querySelector('.comments__body');
                    const placeBefore = getLastElement(newCommentsFormBody, 'comment');

                    newCommentsForm.querySelector('.loader').style.display = 'none';
                    newCommentsFormBody.insertBefore(messageBlock, placeBefore);
                    newCommentsForm.style.left = `${left}px`;
                    newCommentsForm.style.top = `${top}px`;

                    workSpace.appendChild(newCommentsForm)
                    storage.currentComments.push(newCommentsForm);
                }
            }
        }
    }

    function reviewFile(f) {
        if ((storage.mainState !== 'publish')) {
            if (f instanceof File) {
                showAllertMessage('hint');
                setTimeout(() => {
                    forUserInfo.style.display = 'none'
                    menu.style.display = '';
                    currentImage.style.display = '';
                }, 3000);

                return false;
            }
        }
        const file = checkExtension(f);

        if (!file) {
            showAllertMessage('error');
            setTimeout(() => {
                forUserInfo.style.display = 'none';
                menu.style.display = '';
            }, 3000);

            return false;
        }

        return file;
    }

    function checkExtension(file) { 
        if (file instanceof Event) {
            let check = file.target.files[0];

            if (check instanceof File && (check.type === 'image/jpeg' || check.type === 'image/png')) {

                return file.target.files[0];
            } else {
                forUserInfo.style.display = '';
                return false;
            }

        } else if (file instanceof File && (file.type === 'image/jpeg' || file.type === 'image/png')) {

            return file;
        } else {
            forUserInfo.style.display = '';
            return false;
        }
    }

    function showAllertMessage(txt, error = null) { 
        currentImage.style.display = 'none';
        menu.style.display = 'none';
        imageLoader.style.display = 'none'
        forUserInfo.style.display = '';

        switch (txt) {
            case 'hint':
                forUserInfo.children[1].textContent = alertMessages[0];
                break;
            case 'error':
                forUserInfo.children[1].textContent = alertMessages[1];
                break;
            case 'catch':
                forUserInfo.children[1].textContent = alertMessages[2];
                break;
        }
    }

    function wsOnMessage(e) {
        const wsData = JSON.parse(e.data);
        if (wsData.event === 'comment') fillFormHandle(wsData.comment);
        if (wsData.event === 'mask') console.log('mask');
    }
    this.setListenersToForm = function(el) {
        const form = el;

        form.querySelector('.comments__marker-checkbox').addEventListener('click', e => { 
            worker.changeStateAllMarks(true); 
        });

        form.querySelector('.comments__submit').addEventListener('click', e => {
            e.preventDefault();

            form.querySelector('.loader').style.display = '';

            const cords = form.getBoundingClientRect(); 
            const message = form.querySelector('.comments__input').value;
            const id = sessionStorage.getItem('currentId');

            const body = 'message=' + encodeURIComponent(message) + 
                '&left=' + encodeURIComponent(cords.left) +
                '&top=' + encodeURIComponent(cords.top);

            fetch(`https://neto-api.herokuapp.com/pic/${id}/comments`, { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: body
                })
                .then(data => data.json()) 
                .then(json => { 
                    form.querySelector('.loader').style.display = 'none';
                    // fillFormServ(json);
                })
                .catch(error => console.log(error));

            form.querySelector('.loader').style.disply = 'none';
            form.querySelector('.comments__input').value = '';
        });

        form.querySelector('.comments__close').addEventListener('click', e => { 
            e.preventDefault(); 
            if (form.querySelector('.comments__input').value) { 
                form.querySelector('.comments__marker-checkbox').checked = true; 
                form.querySelector('.comments__marker-checkbox').disabled = true;

            } else if (form.querySelector('.comment__message')) { 
                form.querySelector('.comments__marker-checkbox').checked = false; 
                form.querySelector('.comments__marker-checkbox').disabled = false;
                worker.changeStateAllMarks(false); 

            } else {
                workSpace.removeChild(form);
                worker.changeStateAllMarks(false); 
            }
        });
    }

    this.openForm = function(e) { 
        if (e.target !== workSpace.querySelector('canvas')) return; 
        if (storage.mainState !== 'comments') return; 

        const checkActiveForm = Array.from(workSpace.querySelectorAll('form'))
            .find(comment => comment[0].checked); 
        if (checkActiveForm) return;
        worker.changeStateAllMarks(true) 
        const originalForm = worker.createElement(commentsFormTmpl());
        connection.setListenersToForm(originalForm);

        originalForm.querySelector('.loader').style.display = 'none';
        originalForm.querySelector('.comments__marker-checkbox').checked = true;
        originalForm.querySelector('.comments__marker-checkbox').disabled = true;

        originalForm.style.left = `${e.clientX - 21}px`;
        originalForm.style.top = `${e.clientY}px`;

        workSpace.appendChild(originalForm)
                storage.currentComments.push(originalForm);
    }
    this.getCurrentInfo = function(id) { 
        fetch(`https://neto-api.herokuapp.com/pic/${id}`)
            .then(data => data.json())
            .then(json => {
                fillFormServ(json);
                if (window.location.search) storage.setCurrentInfo(json.url);
            })
            .catch(error => console.log(error));
    }
    this.onupload = function(e) { 
        const file = reviewFile(e); 
        if (!file) return;

        worker.removeAllCurrentComments(); 
        menu.style.display = 'none';
        imageLoader.style.display = '';
        currentImage.style.display = 'none';

        const formData = new FormData(); 
        formData.append('title', file.name)
        formData.append('image', file);

        fetch('https://neto-api.herokuapp.com/pic', { 
                body: formData,
                method: 'POST'
            })
            .then(data => data.json())
            .then(json => {
                const id = json.id;
                sessionStorage.setItem('currentId', id); 

                connection.startWebSocketConnect(id); 

                currentImage.style.width = '';
                currentImage.style.height = '';
                currentImage.src = json.url;
                return currentImage;
            })
            .then(img => {
                img.addEventListener('load', drawer.calculateCanvasSize);
                
                link_to_share.setAttribute('value', `${window.location.origin}${window.location.pathname}?${sessionStorage.getItem('currentId')}`);
                sessionStorage.setItem('currentImage', img.src);
                imageLoader.style.display = 'none';
                img.style.display = '';

                storage.mainState = 'share'; 
                storage.positionMenu;
            })
            .catch(error => console.log(error));
    }
    this.startWebSocketConnect = function(id) { 
        const currentid = id;
        const ws = new WebSocket(`wss://neto-api.herokuapp.com/pic/${currentid}`);

        ws.addEventListener('message', wsOnMessage);
        ws.addEventListener('open', e => console.log('Установлено веб-сокет соединение'));
        ws.addEventListener('error', e => console.warn('Произошла ошибка - ', e.error));
        ws.addEventListener('close', e => {
            console.warn(`Веб-сокет соединение закрыто. Код - ${e.code}, причина - `, e.reason);
            if (e.code === 1006) connection.startWebSocketConnect(`wss://neto-api.herokuapp.com/pic/${currentid}`);
        });
    }
    this.showOrhideComments = function(e) { 
        if (e.target.value === 'on') storage.currentComments.forEach(comment => comment.style.display = 'block')
        if (e.target.value === 'off') storage.currentComments.forEach(comment => comment.style.display = 'none')
    }
}

function CanvasDrawer() { 
    const canvas = document.createElement('canvas');
    const c = canvas.getContext('2d');
    const lineSize = 4; 
    
    let isDrawing = false;
    
    workSpace.append(canvas);

    canvas.addEventListener('click', connection.openForm);
    canvas.addEventListener('mousemove', drawOnImage);
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    

    function stopDrawing() {
        isDrawing = false;
        c.closePath();
    }

    function startDrawing(e) {
        isDrawing = true;
        c.beginPath();
        c.moveTo(e.clientX, e.clientY);
    }

    function drawOnImage(e) { 
        c.lineCap = c.lineJoin = 'round';
        c.lineWidth = lineSize;

        if (storage.mainState === 'draw' && isDrawing) {
            c.lineTo(e.clientX, e.clientY - 35);
            c.stroke();
        }
    }
    this.changeColor = function(e) {
        c.strokeStyle = getComputedStyle(e.target.nextElementSibling).backgroundColor; 
    }
    this.calculateCanvasSize = function() {
        const img = currentImage
        img.style.height = `90vh`;

        canvas.width = img.width;
        canvas.height = img.height;
        canvas.style.position = 'relative';
        canvas.style.top = `50%`;
        canvas.style.transform = 'translateY(-50%)';
    }
}

const workSpace = document.querySelector('.app'); 

const connection = new Connection();
const drawer = new CanvasDrawer();
const storage = new Storage();
const worker = new Worker();

const menu = worker.createElement(menutTmpl());
workSpace.prepend(menu);

const imageLoader = document.querySelector('.image-loader');
const link_to_share = document.querySelector('.menu__url');
const forUserInfo = document.querySelector('.error'); 

const currentImage = document.createElement('img'); 


if (sessionStorage.getItem('currentId')) { 
    storage.start_with_image();

} else if (window.location.search) { 
    imageLoader.style.display = '';
    menu.style.display = 'none';

    const searchString = window.location.search; 
    const id = searchString.slice(1);

    connection.getCurrentInfo(id); 
    sessionStorage.setItem('currentId', id);

} else {
    storage.initialization(); 
}

window.addEventListener('load', worker.moveMenu);
window.addEventListener('load', worker.listenStateMenu);
window.addEventListener('load', worker.listenLoadFile);