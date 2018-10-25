'use strict';

class Publish {
    constructor() {
      this.name = 'publish';
    }
    load() {
        return {
            menuView: {
                dataState: 'initial',
                selected: null,
                burger: {
                    display: 'none'
                }
            },
            comments: null,
            canvas: null
        };
    }
}

class Review extends Publish {

}

class State {
  checkSearchLink() {
    return new Promise((res, rej) => {
      const link = window.location.searh;
      if (!window.location.search) {
        return new Publish
      } else {
        res(this.getIdFromShareLink(window.location.search));
      }
    });
  }
  checkStorage() {
    return new Promise((res, rej) => {
      const curState = sessionStorage.getItem('currentState');
      if (!curState) {
        return this.checkSearchLink()
      } else {
        res(curState);
      }
    });
  }
  get currently() {
    return new Promise((res, rej) => {
      res(this.checkStorage());
    });
  }
}
