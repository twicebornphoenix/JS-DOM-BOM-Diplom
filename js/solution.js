'use strict';

//////////////////  ИНИЦИАЛИЗАЦИЯ /////////////////////////////
const connection = new Connection(); // связной
const storage = new Storage(); // кладовщик
const worker = new Worker(); // разнорабочий

const workSpace = document.querySelector('.app');
const menu = createElement(menutTmpl());
workSpace.prepend(menu);
const imageLoader = document.querySelector('.image-loader');

const link_to_share = document.querySelector('.menu__url');
const forUserInfo = document.querySelector('.error');

const canvas = document.createElement('canvas');
workSpace.append(canvas);
const context = canvas.getContext('2d');

const currentImage = document.createElement('img'); // текущее изображение


///////////////////// ОПРЕДЕЛЕНИЕ СТАТУСА ЗАПУСКА ПРИЛОЖЕНИЯ ///////////////////////

if (sessionStorage.getItem('currentId')) {

    // запуск приложения с загруженным на сервер изображением
    storage.start_with_image();
} else if (window.location.search) {

    // запуск приложения после перехода по ссылке, сгенерированной режимом 'Поделиться'
    imageLoader.style.display = '';
    menu.style.display = 'none';

    // помещаем в переменную айдишник изображения, загруженного на сервер
    const searchString = window.location.search;
    const id = searchString.slice(1);

    // запрашиваем у сервера текущие данные по имеющемуся айдишнику
    connection.getCurrentInfo(id);
    sessionStorage.setItem('currentId', id);
} else {

    // 'первый запуск'
    storage.initialization();
}


///////////////////////////////////////////////////////////////////////////
////////////// ВЫПОЛНЕНИЕ РАЗЛИЧНЫХ ВСПОМОГАТЕЛЬНЫХ ФУНКЦИЙ ///////////////
///////////////////////////////////////////////////////////////////////////
// разнорабочий
function Worker() {
    // функция-помощник для изменения отображения меню
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

    // функция, изменяющая отображение меню в соответствии с текущим состоянием приложения
    this.changeViewMenu = function() {
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
    // функция активации/деактивации работы маркеров форм
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
        // переменные меню
        let centerX, centerY, maxX, maxY;
        storage.dragStatus = false;

        // захават меню
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
        // перемещение меню
        function dragMenu(e) {
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
        // вешаем 'слушателей'
        document.querySelector('.drag').addEventListener('mousedown', catchMenu);
        document.addEventListener('mousemove', dragMenu);
        document.addEventListener('mouseup', e => storage.dragStatus = false);
    }
}


//////////////////////////////////////////////////////////////////////////
/////////// ТЕКУЩЕЕ СОСТОЯНИЕ, ХРАНЕНИЕ, ЗНАЧЕНИЯ ПО УМОЛЧАНИЮ ///////////
//////////////////////////////////////////////////////////////////////////
// кладовщик
function Storage() {
    Object.defineProperties(this, {
        // хранения и запись состояния приложения
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
        // хранение и запись положения меню
        getPositionMenu: {
            set: function(e) {
                if (this.dragStatus) {
                    const cords = [e.clientX, e.clientY];
                    sessionStorage.setItem('x, y', cords);
                    menu.style.display = ''
                }
            },
            get: function() {
                if (sessionStorage.getItem('x, y')) {
                    let [x, y] = sessionStorage.getItem('x, y').split(',');

                    menu.style.setProperty('--menu-left', `${x  - 10.4947}px`);
                    menu.style.setProperty('--menu-top', `${y - 31.493}px`);

                    const cords = menu.getBoundingClientRect();
                    if (cords.left < 0) menu.style.setProperty('--menu-left', `${0}px`)
                    if (cords.top < 0) menu.style.setProperty('--menu-top', `${0}px`)
                    menu.style.display = ''
                } else {
                    menu.style.display = ''

                }
            }
        },
        // хранение и запись состояния движения меню
        dragStatus: {
            set: function(newVal) {
                this.currentDragStatus = newVal;
            },  
            get: function() {
                return this.currentDragStatus;
            }
        }
    });
    // 'первый' запуск приложения
    this.initialization = function() {
        storage.mainState = 'publish';
        currentImage.classList.add('current-image');

        return workSpace.insertBefore(currentImage, forUserInfo)
    }
    // запуск/перезагрузка приложения с имеющимся изображением
    this.start_with_image = function() {
        currentImage.classList.add('current-image');
        storage.mainState = sessionStorage.getItem('currentState');
        currentImage.src = sessionStorage.getItem('currentImage');

        link_to_share.setAttribute('value', `${window.location.origin}${window.location.pathname}?${sessionStorage.getItem('currentId')}`);
        currentImage.addEventListener('load', calculateCanvasSize);
        storage.getPositionMenu;

        connection.getCurrentInfo(sessionStorage.getItem('currentId'));
        connection.startWebSocketConnect(sessionStorage.getItem('currentId'));

        return workSpace.insertBefore(currentImage, forUserInfo);
    }
    // запуск приложения после перехода по ссылке, полученной из режима 'Поделиться'
    this.setCurrentInfo = function(url) {
        currentImage.classList.add('current-image');
        currentImage.src = url;
        currentImage.addEventListener('load', calculateCanvasSize);

        storage.mainState = 'comments';
        imageLoader.style.display = 'none';
        menu.style.display = '';

        sessionStorage.setItem('currentImage', url);
        link_to_share.setAttribute('value', `${window.location.origin}${window.location.pathname}?${sessionStorage.getItem('currentId')}`);
        workSpace.insertBefore(currentImage, forUserInfo);
    }
    // переменная для хранения комментариев
    this.currentComments = [];
}


////////////////////////////////////////////////////////////////////////////////////////
//////////// СВЯЗЬ С СЕРВЕРОМ, ВЕБ-СОКЕТ, ДАННЫЕ, НАПОЛНЕНИЕ ДАННЫМИ ///////////////////
////////////////////////////////////////////////////////////////////////////////////////
// связной
function Connection() {
    const alertMessages = [
        'Чтобы загрузить новое изображение, пожалуйста, воспользуйтесь пунктом "Загрузить новое" в меню',
        'Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png',
        'Произошла внутрення ошибка. Обратитесь к вашему системному администратору'
    ]
    // установка слушателей событий клика на закрытие формы и на кнопку отправки формы на сервер
    function setListenersToForm(elem) {
        const form = elem;

        // при клике на маркер формы
        form.querySelector('.comments__marker-checkbox').addEventListener('click', e => {
            // деактивируем возмжность открытия у всех форм по нажатию на маркер 
            worker.changeStateAllMarks(true);
        });

        // при клике на кнопку отправки сообщения
        form.querySelector('.comments__submit').addEventListener('click', e => {
            e.preventDefault(); // отменяем дефолтное событие

            // показываем анимацию загрузки
            form.querySelector('.loader').style.display = '';
            // помещаем в переменные координаты относительно окна, текст сообщения, id картинки
            const cords = form.getBoundingClientRect();
            const message = form.querySelector('.comments__input').value;
            const id = sessionStorage.getItem('currentId');

            // кодируем текст сообщения и координаты
            const body = 'message=' + encodeURIComponent(message) +
                '&left=' + encodeURIComponent(cords.left) +
                '&top=' + encodeURIComponent(cords.top);

            // добавляем комментарий к изображению на сервер
            fetch(`https://neto-api.herokuapp.com/pic/${id}/comments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: body
                })
                // получаем ответ с обновленной инфой о картинке
                .then(data => data.json())
                // передаём объект ответа функции для обновления комментариев картинки
                .then(json => {
                    form.querySelector('.loader').style.display = 'none';
                    fillFormHandle(json);
                })
                .catch(error => console.log(error));
            // очищаем текстовое поле
            form.querySelector('.loader').style.disply = 'none'
            form.querySelector('.comments__input').value = '';
        });

        // при клике на кнопку закрытия
        form.querySelector('.comments__close').addEventListener('click', e => {
            e.preventDefault(); // отменяем дефолтное действие

            // проверяем наличие неопубликованного текста в поле отправки сообщения
            if (form.querySelector('.comments__input').value) {
                // блокируем закрытие формы
                form.querySelector('.comments__marker-checkbox').checked = true;
                form.querySelector('.comments__marker-checkbox').disabled = true;
                // проверяем наличие блока с сообщени(-ем)ями
            } else if (form.querySelector('.comment__message')) {
                // есть блок  и текстовое поле ввода пусто - деактивируем форму
                form.querySelector('.comments__marker-checkbox').checked = false;
                form.querySelector('.comments__marker-checkbox').disabled = false;
                // активируем возмжность открытия у всех форм по нажатию на маркер 
                worker.changeStateAllMarks(false);
            } else {
                // если нет ни того, ни другого, удаляем форму из разметки
                workSpace.removeChild(form);
                // активируем возмжность открытия у всех форм по нажатию на маркер 
                worker.changeStateAllMarks(false);
            }
        });
    }
    // добавление комментари(-ев)я пользователем
    function fillFormHandle(data) {
        // из ответа сервера получаем массив комментариев с помощью Object.entries
        const commentsServerInfo = Object.entries(data.comments);
        // находим на поле изображения активированную(открытую) форму
        const formToFill = Array.from(workSpace.querySelectorAll('form'))
            .find(form => form.children[1].checked);
        // помещаем в переменную последний комментарий из полученного архива
        const commentForPost = commentsServerInfo[`${commentsServerInfo.length - 1}`];
        // создаём из шаблона блок сообщений комментария
        const messageBlock = createElement(commentMessageBlockTmpl());
        // наполняем соответствующие поля блока айдишником, датой, текстом сообщения
        messageBlock.setAttribute('id', commentForPost[0]);
        const messageDate = new Date(commentForPost[1].timestamp).toLocaleString('ru-RU', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        messageBlock.querySelector('.comment__time').textContent = messageDate.split(', ').join(' ');
        messageBlock.querySelector('.comment__message').textContent = commentForPost[1].message;
        // помещаем в переменные будущего родителя блока сообщения и элемент, перед которым будет вставлен блок
        const placeForPost = formToFill.querySelectorAll('.comment')[formToFill.querySelectorAll('.comment').length - 1];
        const bodyComment = formToFill.querySelector('.comments__body');
        // размещаем блок сообщения внутри родителя перед элементом-соседом
        placeForPost.before(messageBlock);
        storage.currentComments.push(formToFill);
    }
    // размещение ранее добавленных комментариев, полученных от сервера,  по формам, 
    // и дальнейшее размещение форм на поле изображения
    function fillFormServ(data) {
        // если нет ни одного комментария к изображению, идём курить
        if (!data.comments) return;
        const comments = Object.entries(data.comments);

        // из полученного архива к каждому элементу(комментарию) применяем функцию
        comments.forEach(comment => {
            distribCommentsContent(comment);
        })

        // функция наполнения блока сообщений контентом
        function distribCommentsContent(comment) {
            // деструктурирем
            let [id, { left, top, timestamp, message }] = comment;

            // форматируем дату 
            const messageDate = new Date(timestamp).toLocaleString('ru-RU', {
                month: '2-digit',
                day: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            // создаём блок сообщений, присваиваем айдишник, вписываем дату и текст сообщения
            const messageBlock = createElement(commentMessageBlockTmpl());
            messageBlock.setAttribute('id', id);
            messageBlock.querySelector('.comment__message').textContent = message;
            messageBlock.querySelector('.comment__time').textContent = messageDate.split(', ').join(' ');

            // передаём полученный блок сообщения с координатами формы функции 
            return distribFormCords(messageBlock, left, top);
        }
        // функция поиска или создания нужной формы для полученного блока сообщений
        function distribFormCords(messageBlock, left, top) {
            // проверка, есть ли на поле изображения формы
            const commentsFormOnImageArea = Array.from(workSpace.querySelectorAll('form'));

            // если нет
            if (!commentsFormOnImageArea.length) {
                // создаём первую форму, вешаем на него слушателей событий,
                const firstCommentsForm = createElement(commentsFormTmpl());
                setListenersToForm(firstCommentsForm);

                const firstCommentsFormBody = firstCommentsForm.querySelector('.comments__body');
                const placeBefore = firstCommentsFormBody.querySelectorAll('.comment')[firstCommentsFormBody.querySelectorAll('.comment').length - 1];

                firstCommentsForm.querySelector('.loader').style.display = 'none';
                // помещаем в неё блок сообщений
                firstCommentsFormBody.insertBefore(messageBlock, placeBefore);

                // присваиваем координаты
                firstCommentsForm.style.left = `${left}px`;
                firstCommentsForm.style.top = `${top}px`

                // размещаем на поле сообщений
                workSpace.appendChild(firstCommentsForm);
                // добавляем в массив текущих форм
                storage.currentComments.push(firstCommentsForm);

            } else {
                // если формы на поле есть, ищем ту форму, у которой те же координаты, которые
                // были переданы в функцию
                const commentsForm = commentsFormOnImageArea
                    .find(form => parseInt(form.style.left) === left && parseInt(form.style.top) === top)

                // если таковая имеется
                if (commentsForm) {
                    // помещаем в неё блок сообщений
                    const commentsFormBody = commentsForm.querySelector('.comments__body');
                    const placeBefore = commentsFormBody.querySelectorAll('.comment')[commentsFormBody.querySelectorAll('.comment').length - 1];

                    commentsFormBody.insertBefore(messageBlock, placeBefore);
                } else {
                    // если нет, то создаём новую форму по шаблону
                    // и проделываем уже знакомую процедуру
                    const newCommentsForm = createElement(commentsFormTmpl());
                    setListenersToForm(newCommentsForm);

                    const newCommentsFormBody = newCommentsForm.querySelector('.comments__body');
                    const placeBefore = newCommentsFormBody.querySelectorAll('.comment')[newCommentsFormBody.querySelectorAll('.comment').length - 1];

                    newCommentsForm.querySelector('.loader').style.display = 'none';
                    newCommentsFormBody.insertBefore(messageBlock, placeBefore);

                    newCommentsForm.style.left = `${left}px`;
                    newCommentsForm.style.top = `${top}px`;

                    workSpace.appendChild(newCommentsForm);
                    storage.currentComments.push(newCommentsForm);
                }
            }
        }
    }
    // проверка файла
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
    // проверка расширения файла
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
    // функция показа ошибки, подказки пользователю
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
    // активация формы при клике на изображения для добавления нового комментария
    this.openForm = function(e) {
        // проверяем, что событие пришло с области текущего изображения
        if (e.target !== workSpace.querySelector('canvas')) return;

        // разрешаем загружать комментарии только в режиме комментирования
        if (storage.mainState !== 'comments') return;

        // проверяем налчие активированных форм отправки сообщения 
        const checkActiveForm = Array.from(workSpace.querySelectorAll('form'))
            .find(comment => comment[0].checked);
        // если есть, то выходим из функции
        if (checkActiveForm) return;

        // деактивируем возможность открытия формт по нажатия на маркер
        worker.changeStateAllMarks(true)

        const originalForm = createElement(commentsFormTmpl());
        setListenersToForm(originalForm);

        originalForm.querySelector('.loader').style.display = 'none';
        originalForm.querySelector('.comments__marker-checkbox').checked = true;
        originalForm.querySelector('.comments__marker-checkbox').disabled = true;

        originalForm.style.left = `${e.clientX - 21}px`;
        originalForm.style.top = `${e.clientY}px`;

        workSpace.appendChild(originalForm);
    }
    // запрос к серверу на получение текущих данных по id
    this.getCurrentInfo = function(id) {
        fetch(`https://neto-api.herokuapp.com/pic/${id}`)
            .then(data => data.json())
            .then(json => {
                fillFormServ(json);
                if (window.location.search) storage.setCurrentInfo(json.url);
            })
            .catch(error => console.log(error));
    }
    // загрузка изображения на сервер
    this.onupload = function(e) {
        // передаём выбранный пользователем файл на проверку
        const file = reviewFile(e);
        if (!file) return;

        // 'очищаем' поле приложения
        worker.removeAllCurrentComments();
        menu.style.display = 'none';
        imageLoader.style.display = '';
        currentImage.style.display = 'none';

        // готовим 'тело' сообщения для загрузки на сервер
        const formData = new FormData();
        formData.append('title', file.name)
        formData.append('image', file);

        // выполняем запрос и загрузку
        fetch('https://neto-api.herokuapp.com/pic', {
                body: formData,
                method: 'POST'
            })
            .then(data => data.json())
            .then(json => {
                const id = json.id;
                sessionStorage.setItem('currentId', id)
                // получили айдишник загруженного изображения
                connection.startWebSocketConnect(id);
                currentImage.style.width = '';
                currentImage.style.height = '';
                currentImage.src = json.url;
                return currentImage;
            })
            .then(img => {
                img.addEventListener('load', calculateCanvasSize);
                link_to_share.setAttribute('value', `${window.location.origin}${window.location.pathname}?${sessionStorage.getItem('currentId')}`);
                // ссылка на текущее изображение
                sessionStorage.setItem('currentImage', img.src);
                imageLoader.style.display = 'none';
                img.style.display = '';
                // переключаем режим на "поделиться", меняем отображение меню в соответствии с режимом
                storage.mainState = 'share';
                storage.getPositionMenu;
            })
            .catch(error => console.log(error));
    }
    // WebSocket
    this.startWebSocketConnect = function(id) {
        const currentid = id;
        const ws = new WebSocket(`wss://neto-api.herokuapp.com/pic/${currentid}`);
        ws.onopen = function() {
            console.info('Установлено вбе-сокет соединение');
        };
        ws.onmessage = function(e) {
            const wsData = e.data;
            if (wsData.pic) console.log(`Информация о картинке - ${wsData.pic}`);
            if (wsData.comment) console.log(`Информация о комментах - ${wsData.comment}`);
            if (wsData.mask) console.log(`Информация о маске - ${wsData.mask}`)
        };
        ws.onerror = function(e) {
            console.warn(`Произошла ошибка - ${e.error}`);
        };
        ws.onclose = function(e) {
            console.warn(`Веб-сокет соединение закрыто. Код - ${e.code}, причина - ${e.reason}`);
            if (e.code === 1006) {
                connection.startWebSocketConnect(`wss://neto-api.herokuapp.com/pic/${currentid}`);
            }
        };
    }
    // перключатель показа/скрытия маркеров сообщений
    this.showOrhideComments = function(e) {
        if (e.target.value === 'on') storage.currentComments.forEach(comment => comment.style.display = 'block')
        if (e.target.value === 'off') storage.currentComments.forEach(comment => comment.style.display = 'none')
    }
}

//////////// ВЫБОР И ПЕРЕДАЧА ЗАГРУЗЧИКУ ФАЙЛА ////////////
// Drag-and-Drop
function DnDselect(e) {
    e.preventDefault();
    const [file] = e.dataTransfer.files;
    console.log(file.size, file.name, file.type)
    connection.onupload(file);
}
// загрузка файла с помощью input
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
// копирование ссылки на изображение в режиме 'Поделиться'
function copyLinkToShare(e) {
    navigator.clipboard.writeText(link_to_share.value)
        .then(successMessage)
        .catch((er) => console.log('something wrong'))
}
// уведомление о статусе результата копирования ссылки
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


////////////////  CANVAS  ///////////////////////////////
function calculateCanvasSize() {
    const img = currentImage
    img.style.height = `90vh`;

    canvas.width = img.width;
    canvas.height = img.height;
    canvas.style.position = 'relative';
    canvas.style.top = `50%`;
    canvas.style.transform = 'translateY(-50%)';
}


///////////  ФУНКЦИЯ, СОЗДАЮЩАЯ ДИНАМИЧЕСКИ /////////////
//////////////  НАПОЛНЯЕМЫЕ ЭЛЕМЕНТЫ ////////////////////
function createElement(obj) {
    if (Array.isArray(obj)) {
        return obj.reduce((f, el) => {
            f.append(createElement(el));

            return f;
        }, document.createDocumentFragment());
    }
    if (typeof obj === 'string') return document.createTextNode(obj)
    const el = document.createElement(obj.tag);
    [].concat(obj.cls || []).forEach(clsName => el.classList.add(clsName));

    if (obj.attrs) Object.keys(obj.attrs).forEach(key => el.setAttribute(key, obj.attrs[key]));
    if (obj.childs) el.appendChild(createElement(obj.childs));

    return el;
}


//////////////////  EVENTLISTENERS  ////////////////////////
window.addEventListener('load', worker.moveMenu);

workSpace.addEventListener('dragover', e => e.preventDefault());
workSpace.addEventListener('drop', DnDselect);
canvas.addEventListener('click', connection.openForm);

menu.addEventListener('mousemove', e => storage.getPositionMenu = e);
menu.querySelector('.new').addEventListener('click', handleFileSelect, true);
menu.querySelector('.burger').addEventListener('click', e => storage.mainState = 'default');
menu.querySelector('.share').addEventListener('click', e => storage.mainState !== 'share' ? storage.mainState = 'share' : '', true);

menu.querySelector('.menu_copy').addEventListener('click', copyLinkToShare);
menu.querySelector('.draw').addEventListener('click', e => storage.mainState = 'draw');
menu.querySelector('.comments').addEventListener('click', e => storage.mainState = 'comments');
menu.querySelector('.menu__toggle-bg').addEventListener('change', connection.showOrhideComments);


////////////////////// ШАБЛОНЫ ДИНАМИЧЕСКИ НАПОЛНЯЕМЫХ //////////////
/////////////////////////// ЭЛЕМЕНТОВ ПРИЛОЖЕНИЯ //////////////
// шаблон меню
function menutTmpl(data) {
    return {
        tag: 'ul',
        cls: ['menu'],
        attrs: {
            'data-state': ''
        },
        childs: [{
                tag: 'li',
                cls: ['menu__item', 'drag']
            },
            {
                tag: 'li',
                cls: ['menu__item', 'burger'],
                childs: {
                    tag: 'i',
                    cls: ['burger-icon']
                }
            },
            {
                tag: 'li',
                cls: ['menu__item', 'mode', 'new'],
                childs: [{
                        tag: 'i',
                        cls: ['menu__icon', 'new-icon']
                    },
                    {
                        tag: 'span',
                        cls: ['menu__item-title'],
                        childs: [
                            'Загрузить',
                            {
                                tag: 'br'
                            },
                            'новое'
                        ]
                    }
                ]
            },
            {
                tag: 'li',
                cls: ['menu__item', 'mode', 'comments'],
                attrs: {
                    'data-state': ''
                },
                childs: [{
                        tag: 'i',
                        cls: ['menu__icon', 'comments-icon']
                    },
                    {
                        tag: 'span',
                        cls: ['menu__item-title'],
                        childs: 'Комментарии'
                    }
                ]
            },
            {
                tag: 'li',
                cls: ['menu__item', 'tool', 'comments-tools'],
                childs: {
                    tag: 'span',
                    cls: ['menu__toggle-bg'],
                    childs: [{
                            tag: 'input',
                            cls: ['menu__toggle'],
                            attrs: {
                                'type': 'radio',
                                'name': 'toggle',
                                'value': 'on',
                                'id': 'comments-on',
                                'checked': true
                            }
                        },
                        {
                            tag: 'label',
                            cls: ['menu__toggle-title', 'menu__toggle-title_on'],
                            attrs: {
                                'for': 'comments-on'
                            },
                            childs: ['Показать',
                                {
                                    tag: 'br'
                                },
                                'комментарии'
                            ]
                        },
                        {
                            tag: 'input',
                            cls: ['menu__toggle'],
                            attrs: {
                                'type': 'radio',
                                'name': 'toggle',
                                'value': 'off',
                                'id': 'comments-off'
                            },
                        },
                        {
                            tag: 'label',
                            cls: ['menu__toggle-title', 'menu__toggle-title_off'],
                            attrs: {
                                'for': 'comments-off'
                            },
                            childs: ['Скрыть',
                                {
                                    tag: 'br',
                                },
                                'комментарии'
                            ]
                        },
                        {
                            tag: 'span',
                            cls: 'menu__toggle-bttn'
                        }
                    ]
                }
            },
            {
                tag: 'li',
                cls: ['menu__item', 'mode', 'draw'],
                attrs: {
                    'data-state': ''
                },
                childs: [{
                        tag: 'i',
                        cls: ['menu__icon', 'draw-icon']
                    },
                    {
                        tag: 'span',
                        cls: ['menu__item-title'],
                        childs: 'Рисовать'
                    }
                ]
            },
            {
                tag: 'li',
                cls: ['menu__item', 'tool', 'draw-tools'],
                childs: [{
                        tag: 'input',
                        cls: ['menu__color', 'red'],
                        attrs: {
                            'type': 'radio',
                            'name': 'color',
                            'value': 'red'
                        }
                    },
                    {
                        tag: 'span'
                    },
                    {
                        tag: 'input',
                        cls: ['menu__color', 'yellow'],
                        attrs: {
                            'type': 'radio',
                            'name': 'color',
                            'value': 'yellow'
                        }
                    },
                    {
                        tag: 'span'
                    },
                    {
                        tag: 'input',
                        cls: ['menu__color', 'green'],
                        attrs: {
                            'type': 'radio',
                            'name': 'color',
                            'value': 'green',
                            'checked': true
                        }
                    },
                    {
                        tag: 'span'
                    },
                    {
                        tag: 'input',
                        cls: ['menu__color', 'blue'],
                        attrs: {
                            'type': 'radio',
                            'name': 'color',
                            'value': 'blue'
                        }
                    },
                    {
                        tag: 'span'
                    },
                    {
                        tag: 'input',
                        cls: ['menu__color', 'purple'],
                        attrs: {
                            'type': 'radio',
                            'name': 'color',
                            'value': 'purple'
                        }
                    },
                    {
                        tag: 'span'
                    }
                ]
            },
            {
                tag: 'li',
                cls: ['menu__item', 'mode', 'share'],
                attrs: {
                    'data-state': ''
                },
                childs: [{
                        tag: 'i',
                        cls: ['menu__icon', 'share-icon']
                    },
                    {
                        tag: 'span',
                        cls: ['menu__item-title'],
                        childs: 'Поделиться'
                    }
                ]
            },
            {
                tag: 'li',
                cls: ['menu__item', 'tool', 'share-tools'],
                childs: [{
                        tag: 'input',
                        cls: ['menu__url'],
                        attrs: {
                            'type': 'text',
                            'value': 'https://somelink'
                        }
                    },
                    {
                        tag: 'input',
                        cls: ['menu_copy'],
                        attrs: {
                            'type': 'button',
                            'value': 'Копировать'
                        }
                    }
                ]
            }
        ]
    }
}
// шабон формы комментария
function commentsFormTmpl() {
    return {
        tag: 'form',
        cls: ['comments__form'],
        childs: [{
                tag: 'span',
                cls: ['comments__marker']
            },
            {
                tag: 'input',
                cls: ['comments__marker-checkbox'],
                attrs: {
                    'type': 'checkbox'
                }
            },
            {
                tag: 'div',
                cls: ['comments__body'],
                childs: [{
                        tag: 'div',
                        cls: ['comment'],
                        childs: {
                            tag: 'div',
                            cls: ['loader'],
                            childs: [{
                                    tag: 'span'
                                },
                                {
                                    tag: 'span'
                                },
                                {
                                    tag: 'span'
                                },
                                {
                                    tag: 'span'
                                },
                                {
                                    tag: 'span'
                                }
                            ]
                        }
                    },
                    {
                        tag: 'textarea',
                        cls: ['comments__input'],
                        attrs: {
                            'type': 'text',
                            'placeholder': 'Напишите ответ...'
                        }
                    },
                    {
                        tag: 'input',
                        cls: ['comments__close'],
                        attrs: {
                            'type': 'button',
                            'value': 'Закрыть'
                        }
                    },
                    {
                        tag: 'input',
                        cls: ['comments__submit'],
                        attrs: {
                            'type': 'submit',
                            'value': 'Отправить'
                        }
                    }
                ]
            }
        ]
    }
}
// шаблон блока с текстом и датой комментария
function commentMessageBlockTmpl() {
    return {
        tag: 'div',
        cls: ['comment'],
        childs: [{
                tag: 'p',
                cls: ['comment__time'],
                childs: ''
            },
            {
                tag: 'p',
                cls: ['comment__message'],
                childs: ''
            }
        ]
    }
}