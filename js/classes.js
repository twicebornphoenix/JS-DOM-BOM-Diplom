'use strict';

class AppArea {
  constructor(parent) {
    this.wrap = parent.appendChild(createElement({tag: 'div', cls: 'wrap app'}));
    this.wrap.setAttribute('data-state', 'initial');
    this.commentsMap = new Map();
  }
  moveMenu() {

  }
  clear() {

  }
}

class Menu {
  constructor() {
  }
}

class Publish {
    constructor() {
      this.name = 'publish';
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
    get state() {
        if (!sessionStorage.getItem('currentState')) this.state = this.firstStart();
        return sessionStorage.getItem('currentState');
    }
    set state(st) {
        sessionStorage.setItem('currentState', st);
    }
    activateCurrentState() {
        const currState = JSON.parse(this.state);
    }
}

class Review extends Publish {

}

class State {
  constructor() {
    this.currently = this.state;
  }
  checkStorage() {
    return new Promise()sessionStorage.getItem('currentState');
  }
  checkSearchLink() {
    if (window.location.search)
    return 
  }
  get state() {
    this.checkStorage();
  }
}
