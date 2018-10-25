'use strict';

function appWrapTmpl() {
    return {
        tag: 'div',
        cls: 'wrap app',
        attrs: {
            'data-state': 'initial'
        }
    }
}

function menuTmpl() {
    return {
        tag: 'ul',
        cls: 'menu',
        attrs: {
            'data-state': 'initial'
        },
        childs: [{
                tag: 'li',
                cls: 'menu__item drag',
            },
            {
                tag: 'li',
                cls: 'menu__item burger',
                styles: {
                    display: 'none'
                },
                childs: {
                    tag: 'i',
                    cls: ['burger-icon']
                }
            },
            {
                tag: 'li',
                cls: 'menu__item mode new',
                childs: [{
                        tag: 'i',
                        cls: 'menu__icon new-icon'
                    },
                    {
                        tag: 'span',
                        cls: 'menu__item-title',
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
                cls: 'menu__item mode comments',
                attrs: {
                    'data-state': ''
                },
                childs: [{
                        tag: 'i',
                        cls: 'menu__icon comments-icon'
                    },
                    {
                        tag: 'span',
                        cls: 'menu__item-title',
                        childs: 'Комментарии'
                    }
                ]
            },
            {
                tag: 'li',
                cls: 'menu__item tool comments-tools',
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
                            cls: 'menu__toggle-title menu__toggle-title_on',
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
                            cls: 'menu__toggle',
                            attrs: {
                                'type': 'radio',
                                'name': 'toggle',
                                'value': 'off',
                                'id': 'comments-off'
                            },
                        },
                        {
                            tag: 'label',
                            cls: 'menu__toggle-title menu__toggle-title_off',
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
                cls: 'menu__item mode draw',
                attrs: {
                    'data-state': ''
                },
                childs: [{
                        tag: 'i',
                        cls: 'menu__icon draw-icon'
                    },
                    {
                        tag: 'span',
                        cls: 'menu__item-title',
                        childs: 'Рисовать'
                    }
                ]
            },
            {
                tag: 'li',
                cls: 'menu__item tool draw-tools',
                childs: [{
                        tag: 'input',
                        cls: 'menu__color red',
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
                        cls: 'menu__color yellow',
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
                        cls: 'menu__color green',
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
                        cls: 'menu__color blue',
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
                        cls: 'menu__color purple',
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
                cls: 'menu__item mode share',
                attrs: {
                    'data-state': ''
                },
                childs: [{
                        tag: 'i',
                        cls: 'menu__icon share-icon'
                    },
                    {
                        tag: 'span',
                        cls: 'menu__item-title',
                        childs: 'Поделиться'
                    }
                ]
            },
            {
                tag: 'li',
                cls: 'menu__item tool share-tools',
                childs: [{
                        tag: 'input',
                        cls: 'menu__url',
                        attrs: {
                            'type': 'text',
                            'value': 'https://somelink'
                        }
                    },
                    {
                        tag: 'input',
                        cls: 'menu_copy',
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