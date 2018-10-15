'use strict';

//////////////////  ИНИЦИАЛИЗАЦИЯ /////////////////////////////
const workSpace = document.querySelector('.app'); // 'рабочая область' приложения

const connection = new Connection(); // связной
const drawer = new CanvasDrawer(); // художник
const worker = new Worker(); // разнорабочий
const storage = new Storage(); // кладовщик

const menu = worker.createElement(menutTmpl()); // меню
workSpace.prepend(menu);

const imageLoader = document.querySelector('.image-loader'); // анимация загрузки
const link_to_share = document.querySelector('.menu__url'); // ссылка 'поделиться'
const forUserInfo = document.querySelector('.error'); // сообщение об ошибке

const currentImage = document.createElement('img'); // текущее изображение


///////////////////// ОПРЕДЕЛЕНИЕ СТАТУСА ЗАПУСКА ПРИЛОЖЕНИЯ ///////////////////////

if (sessionStorage.getItem('currentId')) { // запуск приложения с загруженным на сервер изображением
    storage.start_with_image();

} else if (window.location.search) { // запуск приложения после перехода по ссылке, сгенерированной режимом 'Поделиться'
    imageLoader.style.display = '';
    menu.style.display = 'none';

    const searchString = window.location.search; // помещаем в переменную айдишник изображения, загруженного на сервер
    const id = searchString.slice(1);

    connection.getCurrentInfo(id); // запрашиваем у сервера текущие данные по имеющемуся айдишнику
    sessionStorage.setItem('currentId', id);

} else {
    storage.initialization(); // 'первый запуск'
}


///////////////////////////////////////////////////////////////////////////
////////////// ВЫПОЛНЕНИЕ РАЗЛИЧНЫХ ВСПОМОГАТЕЛЬНЫХ ФУНКЦИЙ ///////////////
///////////////////////////////////////////////////////////////////////////
function Worker() { // разнорабочий
    function setDataState(cls, value, init = false) { // функция-помощник для изменения отображения меню
        const burger = document.querySelector('.burger');
        if (value === 'default') {
            menu.dataset.state = value;

            return;
        };
        if (cls === '.burger') burger.style.display = value;
        document.querySelector(cls).dataset.state = value;
        menu.dataset.state = init || value;
    }

    function copyLinkToShare(e) { // копирование ссылки на изображение в режиме 'Поделиться'
        navigator.clipboard.writeText(link_to_share.value)
            .then(successMessage)
            .catch((er) => console.log('something wrong'))
    }

    function successMessage() { // уведомление о статусе результата копирования ссылки
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

    function DnDselect(e) { // Drag-and-Drop
        e.preventDefault();
        const [file] = e.dataTransfer.files;
        console.log(file.size, file.name, file.type)
        connection.onupload(file);
    }

    function handleFileSelect(e) { // загрузка файла с помощью input
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

    function calculateMenuCords() { // рассчитываем и сохраняем координаты меню
        const menuCords = menu.getBoundingClientRect();
        storage.positionMenu = [menuCords.left, menuCords.top, menuCords.width];
    }
    this.createElement = function(obj) { // функция-строитель динамически наполняемых элементов
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
    this.changeViewMenu = function() { // функция, изменяющая отображение меню в соответствии с текущим состоянием приложения
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
    this.changeStateAllMarks = function(value) { // функция активации/деактивации работы маркеров форм
        const forms = Array.from(workSpace.querySelectorAll('form'));
        forms.forEach(form => {
            form.querySelector('.comments__marker-checkbox').disabled = value;
        })
    }
    this.removeAllCurrentComments = function() { // удаление маркеров всех комментариев при перезагрузке
        storage.currentComments.forEach(comment => {
            workSpace.removeChild(comment);
        })
    }
    this.moveMenu = function(e) { // перемещение меню
        let centerX, centerY, maxX, maxY; // переменные меню
        storage.dragStatus = false;

        function catchMenu(e) { // захават меню
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

        function dragMenu(e) { // перемещение меню
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
        menu.addEventListener('mousemove', calculateMenuCords); // рассчитываем и сохраняем текущие координаты меню
        document.querySelector('.drag').addEventListener('mousedown', catchMenu);
        document.addEventListener('mousemove', dragMenu);
        document.addEventListener('mouseup', e => storage.dragStatus = false);
    }
    this.listenStateMenu = function() { // слушаем события меню
        menu.addEventListener('click', e => {
            let target = e.target; // помещаем в переменную target событие клика 

            if (!(e.target.classList.contains('mode') || e.target.classList.contains('burger')))
                target = e.target.offsetParent; // определяем вложенность клика

            // при клике на какую-либо кнопку меню активируется соответствующий режим
            if (target.classList.contains('new')) handleFileSelect(); // загрузка файла через input
            if (target.classList.contains('burger')) storage.mainState = 'default';
            if (target.classList.contains('comments')) storage.mainState = 'comments';
            if (target.classList.contains('draw')) storage.mainState = 'draw';
            if (target.classList.contains('share')) storage.mainState = 'share';
        });

        menu.querySelector('.menu_copy').addEventListener('click', copyLinkToShare); // копирование ссылки
        menu.querySelector('.menu__toggle-bg').addEventListener('change', connection.showOrhideComments); // переключатель скрыть/показать маркеры комментариев
    }
    this.listenLoadFile = function() { // слушаем события загрузки файла
        workSpace.addEventListener('dragover', e => e.preventDefault());
        workSpace.addEventListener('drop', DnDselect);

    }
}


//////////////////////////////////////////////////////////////////////////
/////////// ТЕКУЩЕЕ СОСТОЯНИЕ, ХРАНЕНИЕ, ЗНАЧЕНИЯ ПО УМОЛЧАНИЮ ///////////
//////////////////////////////////////////////////////////////////////////
function Storage() { // кладовщик
    Object.defineProperties(this, {
        mainState: { // хранения и запись состояния приложения
            get: function() {
                return sessionStorage.getItem('currentState');
            },
            set: function(newV) {
                const currentAppState = newV;
                sessionStorage.setItem('currentState', newV);
                worker.changeViewMenu();
            }
        },
        positionMenu: { // хранение и запись положения меню
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
        dragStatus: { // хранение и запись состояния движения меню
            set: function(newVal) {
                this.currentDragStatus = newVal;
            },
            get: function() {
                return this.currentDragStatus;
            }
        }
    });
    this.initialization = function() { // 'первый' запуск приложения
        storage.mainState = 'publish';
        currentImage.classList.add('current-image');
        return workSpace.insertBefore(currentImage, forUserInfo)
    }
    this.start_with_image = function() { // запуск/перезагрузка приложения с имеющимся изображением
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
    this.setCurrentInfo = function(url) { // запуск приложения после перехода по ссылке, полученной из режима 'Поделиться'
        currentImage.classList.add('current-image');
        currentImage.src = url;
        currentImage.addEventListener('load', canvas.calculateCanvasSize);

        storage.mainState = 'comments';
        imageLoader.style.display = 'none';
        menu.style.display = '';

        sessionStorage.setItem('currentImage', url);
        link_to_share.setAttribute('value', `${window.location.origin}${window.location.pathname}?${sessionStorage.getItem('currentId')}`);
        workSpace.insertBefore(currentImage, forUserInfo);
    }
    this.currentComments = []; // переменная для хранения комментариев
}


////////////////////////////////////////////////////////////////////////////////////////
//////////// ЗАПРОСЫ К СЕРВЕРУ, ВЕБ-СОКЕТ, ЗАГРУЗКА ФАЙЛА, НАПОЛНЕНИЕ ДАННЫМИ //////////
////////////////////////////////////////////////////////////////////////////////////////
function Connection() { // связной
    const alertMessages = [
        'Чтобы загрузить новое изображение, пожалуйста, воспользуйтесь пунктом "Загрузить новое" в меню',
        'Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png',
        'Произошла внутрення ошибка. Обратитесь к вашему системному администратору'
    ]

    function setListenersToForm(elem) { // установка слушателей событий клика на закрытие формы и на кнопку отправки формы на сервер
        const form = elem;

        form.querySelector('.comments__marker-checkbox').addEventListener('click', e => { // при клике на маркер формы
            worker.changeStateAllMarks(true); // деактивируем возмжность открытия у всех форм по нажатию на маркер 
        });

        form.querySelector('.comments__submit').addEventListener('click', e => { // при клике на кнопку отправки сообщения
            e.preventDefault(); // отменяем дефолтное событие

            form.querySelector('.loader').style.display = ''; // показываем анимацию загрузки

            const cords = form.getBoundingClientRect(); // помещаем в переменные координаты относительно окна, текст сообщения, id картинки
            const message = form.querySelector('.comments__input').value;
            const id = sessionStorage.getItem('currentId');

            const body = 'message=' + encodeURIComponent(message) + // кодируем текст сообщения и координаты
                '&left=' + encodeURIComponent(cords.left) +
                '&top=' + encodeURIComponent(cords.top);

            fetch(`https://neto-api.herokuapp.com/pic/${id}/comments`, { // добавляем комментарий к изображению на сервер
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: body
                })
                .then(data => data.json()) // получаем ответ с обновленной инфой о картинке
                .then(json => { // передаём объект ответа функции для обновления комментариев картинки
                    form.querySelector('.loader').style.display = 'none';
                    fillFormHandle(json);
                })
                .catch(error => console.log(error));

            form.querySelector('.loader').style.disply = 'none' // очищаем текстовое поле
            form.querySelector('.comments__input').value = '';
        });

        form.querySelector('.comments__close').addEventListener('click', e => { // при клике на кнопку закрытия
            e.preventDefault(); // отменяем дефолтное действие
            if (form.querySelector('.comments__input').value) { // проверяем наличие неопубликованного текста в поле отправки сообщения
                form.querySelector('.comments__marker-checkbox').checked = true; // блокируем закрытие формы
                form.querySelector('.comments__marker-checkbox').disabled = true;

            } else if (form.querySelector('.comment__message')) { // проверяем наличие блока с сообщени(-ем)ями
                form.querySelector('.comments__marker-checkbox').checked = false; // есть блок  и текстовое поле ввода пусто - деактивируем форму
                form.querySelector('.comments__marker-checkbox').disabled = false;
                worker.changeStateAllMarks(false); // активируем возмжность открытия у всех форм по нажатию на маркер 

            } else {
                workSpace.removeChild(form); // если нет ни того, ни другого, удаляем форму из разметки
                worker.changeStateAllMarks(false); // активируем возмжность открытия у всех форм по нажатию на маркер 
            }
        });
    }

    function fillFormHandle(data) { // добавление комментари(-ев)я пользователем
        const commentsServerInfo = Object.entries(data.comments);

        const formToFill = Array.from(workSpace.querySelectorAll('form'))
            .find(form => form.children[1].checked); // находим на поле изображения активированную(открытую) форму

        const commentForPost = commentsServerInfo[`${commentsServerInfo.length - 1}`]; // помещаем в переменную последний комментарий из полученного архива
        const messageBlock = worker.createElement(commentMessageBlockTmpl()); // создаём из шаблона блок сообщений комментария

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
        if (!data.comments) return; // если нет ни одного комментария к изображению, идём курить
        const comments = Object.entries(data.comments);

        comments.forEach(comment => { // из полученного архива к каждому элементу(комментарию) применяем функцию
            distribCommentsContent(comment);
        })

        function distribCommentsContent(comment) { // функция наполнения блока сообщений контентом
            let [id, { left, top, timestamp, message }] = comment;

            const messageDate = new Date(timestamp).toLocaleString('ru-RU', { // форматируем дату 
                month: '2-digit',
                day: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            const messageBlock = worker.createElement(commentMessageBlockTmpl()); // создаём блок сообщений, присваиваем айдишник, вписываем дату и текст сообщения
            messageBlock.setAttribute('id', id);
            messageBlock.querySelector('.comment__message').textContent = message;
            messageBlock.querySelector('.comment__time').textContent = messageDate.split(', ').join(' ');

            return distribFormCords(messageBlock, left, top); // передаём полученный блок сообщения с координатами формы функции 
        }

        function distribFormCords(messageBlock, left, top) { // функция поиска или создания нужной формы для полученного блока сообщений
            const commentsFormOnImageArea = Array.from(workSpace.querySelectorAll('form')); // проверка, есть ли на поле изображения формы

            if (!commentsFormOnImageArea.length) { // если нет, создаём первую форму, вешаем на него слушателей событий
                const firstCommentsForm = worker.createElement(commentsFormTmpl());
                setListenersToForm(firstCommentsForm);

                const firstCommentsFormBody = firstCommentsForm.querySelector('.comments__body');
                const placeBefore = firstCommentsFormBody.querySelectorAll('.comment')[firstCommentsFormBody.querySelectorAll('.comment').length - 1];

                firstCommentsForm.querySelector('.loader').style.display = 'none';
                firstCommentsFormBody.insertBefore(messageBlock, placeBefore); // помещаем в неё блок сообщений

                firstCommentsForm.style.left = `${left}px`; // присваиваем координаты
                firstCommentsForm.style.top = `${top}px`

                workSpace.appendChild(firstCommentsForm); // размещаем на поле сообщений
                storage.currentComments.push(firstCommentsForm); // добавляем в массив текущих форм

            } else { // если формы на поле есть, ищем ту форму, у которой те же координаты, которые были переданы в функцию
                const commentsForm = commentsFormOnImageArea
                    .find(form => parseInt(form.style.left) === left && parseInt(form.style.top) === top)

                if (commentsForm) { // если таковая имеется помещаем в неё блок сообщений
                    const commentsFormBody = commentsForm.querySelector('.comments__body');
                    const placeBefore = commentsFormBody.querySelectorAll('.comment')[commentsFormBody.querySelectorAll('.comment').length - 1];

                    commentsFormBody.insertBefore(messageBlock, placeBefore);
                } else { // если нет, то создаём новую форму по шаблону и проделываем уже знакомую процедуру
                    const newCommentsForm = worker.createElement(commentsFormTmpl());
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

    function reviewFile(f) { // проверка файла
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

    function checkExtension(file) { // проверка расширения файла
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

    function showAllertMessage(txt, error = null) { // функция показа ошибки, подказки пользователю
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
        if (e.target !== workSpace.querySelector('canvas')) return; // проверяем, что событие пришло с области текущего изображения
        if (storage.mainState !== 'comments') return; // разрешаем загружать комментарии только в режиме комментирования

        const checkActiveForm = Array.from(workSpace.querySelectorAll('form'))
            .find(comment => comment[0].checked); // проверяем налчие активированных форм отправки сообщения 
        if (checkActiveForm) return; // если есть, то выходим из функции

        worker.changeStateAllMarks(true) // деактивируем возможность открытия формт по нажатия на маркер

        const originalForm = worker.createElement(commentsFormTmpl());
        setListenersToForm(originalForm);

        originalForm.querySelector('.loader').style.display = 'none';
        originalForm.querySelector('.comments__marker-checkbox').checked = true;
        originalForm.querySelector('.comments__marker-checkbox').disabled = true;

        originalForm.style.left = `${e.clientX - 21}px`;
        originalForm.style.top = `${e.clientY}px`;

        workSpace.appendChild(originalForm);
    }
    this.getCurrentInfo = function(id) { // запрос к серверу на получение текущих данных по id
        fetch(`https://neto-api.herokuapp.com/pic/${id}`)
            .then(data => data.json())
            .then(json => {
                fillFormServ(json);
                if (window.location.search) storage.setCurrentInfo(json.url);
            })
            .catch(error => console.log(error));
    }
    this.onupload = function(e) { // загрузка изображения на сервер
        const file = reviewFile(e); // передаём выбранный пользователем файл на проверку
        if (!file) return;

        worker.removeAllCurrentComments(); // 'очищаем' поле приложения
        menu.style.display = 'none';
        imageLoader.style.display = '';
        currentImage.style.display = 'none';

        const formData = new FormData(); // готовим 'тело' сообщения для загрузки на сервер
        formData.append('title', file.name)
        formData.append('image', file);

        fetch('https://neto-api.herokuapp.com/pic', { // выполняем запрос и загрузку
                body: formData,
                method: 'POST'
            })
            .then(data => data.json())
            .then(json => {
                const id = json.id;
                sessionStorage.setItem('currentId', id); // получили айдишник загруженного изображения

                connection.startWebSocketConnect(id); // запускаем WebSocket

                currentImage.style.width = '';
                currentImage.style.height = '';
                currentImage.src = json.url;
                return currentImage;
            })
            .then(img => {
                img.addEventListener('load', drawer.calculateCanvasSize);
                // ссылка на текущее изображение
                link_to_share.setAttribute('value', `${window.location.origin}${window.location.pathname}?${sessionStorage.getItem('currentId')}`);
                sessionStorage.setItem('currentImage', img.src);
                imageLoader.style.display = 'none';
                img.style.display = '';

                storage.mainState = 'share'; // переключаем режим на "поделиться", меняем отображение меню в соответствии с режимом
                storage.positionMenu;
            })
            .catch(error => console.log(error));
    }
    this.startWebSocketConnect = function(id) { // WebSocket
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
    this.showOrhideComments = function(e) { // перключатель показа/скрытия маркеров сообщений
        if (e.target.value === 'on') storage.currentComments.forEach(comment => comment.style.display = 'block')
        if (e.target.value === 'off') storage.currentComments.forEach(comment => comment.style.display = 'none')
    }
}

/////////////////////////////////////////////////////////////////////
////////////////////////////  CANVAS  ///////////////////////////////
/////////////////////////////////////////////////////////////////////
function CanvasDrawer() {
    const canvas = document.createElement('canvas');
    const c = canvas.getContext('2d');
    workSpace.append(canvas);

    canvas.addEventListener('click', connection.openForm);
    canvas.addEventListener('mousemove', drawOnImage);

    function startDraw() {

    }

    function stopDraw() {
    	isDrawing = false;
    }

    function drawOnImage(e) {
    	if (storage.mainState !== 'draw') return; // если режим не 'рисование', выходим из функции
/*    	if (!e.which) return;	// если левая кнопка не зажата при перемещении курсора, выходим из функции*/
    	i
    	if (isDrawig) {
    			console.log(e.clientX, e.clientY);
    			c.beginPath();
    	}
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


//////////////////  MAIN_EVENT_LISTENERS  ////////////////////////
window.addEventListener('load', worker.moveMenu);
window.addEventListener('load', worker.listenStateMenu);
window.addEventListener('load', worker.listenLoadFile);