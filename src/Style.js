import detectScoped from '../util/detectScoped';

export default class Style {
  constructor(root = document.body) {
    this.compat = detectScoped.check();
    this.style = document.createElement('style');

    root = root.length ? root[0] : root;
    root.insertBefore(this.style, root.firstChild);
  }

  insertRule(rule, index) {
    return this.sheet.insertRule(rule, index);
  }

  deleteRule(index) {
    this.sheet.deleteRule(index);
  }

  destroy() {
    this.style.parentNode.removeChild(this.style);
  }

  get sheet() {
    return this.style[this.compat.sheet];
  }

  get cssRules() {
    return this.sheet[this.compat.rules];
  }
}
