import RuleList from './RuleList';
import Style from './Style';
import defaultExtensions from './defaultExtensions';
import css from './util/css';

function getVendorPrefixRegex() {
  const otherVendorPrefixesMap = {
    moz: ['webkit', 'ms'],
    webkit: ['moz', 'ms'],
    ms: ['webkit', 'moz'],
  };
  const ua = navigator.userAgent.toLowerCase();
  const vendorPrefix = ua.indexOf('trident') > -1 ? 'ms' : (ua.indexOf('webkit') > -1 ? 'webkit' : 'moz');
  const otherVendorPrefixes = otherVendorPrefixesMap[vendorPrefix];

  return new RegExp(':-(' + otherVendorPrefixes.join('|') + ')-');
}
const hasDom = typeof window !== 'undefined';
const otherPrefixRegex = hasDom ? getVendorPrefixRegex() : new RegExp();

export default class {
  constructor(root, extensions) {
    this.extensions = Object.assign({}, defaultExtensions, extensions);
    this.rules = new RuleList();
    this._toggleKeys = {};

    if (hasDom) {
      this.style = new Style(root);
    }
  }

  destroy() {
    if (this.style) {
      this.style.destroy();
    }
  }

  insert(selector, spec) {
    // ignore rules that contain the other vendor prefix, as trying to
    // insert them into a stylesheet will cause an exception to be thrown
    // @see: http://stackoverflow.com/questions/23050001/insert-multiple-css-rules-into-a-stylesheet
    if (hasDom && otherPrefixRegex.test(selector)) {
      return {
        artifacts: {},
      };
    }

    return this.rules.insert(selector, spec);
  }

  process(payload) {
    if (!hasDom) {
      return;
    }

    this._state = payload;
    this.rules.generateArrayRules(this._state, this.extensions);
    this.rules.getRules().forEach(this._process, this);

    // remove leftover rules
    for (let i = this.style.cssRules.length; i > this.rules.getRules().length; i--) {
      this.style.deleteRule(i - 1);
    }
  }

  toString(payload) {
    let result = '';
    let mediaQueryResult = '';

    this._state = payload;
    this.rules.generateArrayRules(this._state, this.extensions);

    for (let rule of this.rules.getRules()) {
      rule.process(this._getStateWithToggles(), this.extensions);
      result += css.toString(rule.getSelector(), rule.result);
    }

    for (let query of this.rules.getMediaQueries()) {
      query.process(this._getStateWithToggles(), this.extensions);
      mediaQueryResult += `${query.getSelector()}{${query.result}}`;
    }

    return result + mediaQueryResult;
  }

  toggleSelector(key, isToggled) {
    const isCurrentlyToggled = this._toggleKeys[key] || false;
    this._toggleKeys[key] = isToggled;

    if (isToggled !== isCurrentlyToggled) {
      this.process(this._state);
    }
  }

  getRules() {
    return this.rules.getRules();
  }

  getArrayRuleDescriptors() {
    return this.rules.getArrayRuleDescriptors();
  }

  getTraces() {
    return this.rules.getTraces();
  }

  _process(rule, i) {
    let result = rule.process(this._getStateWithToggles(), this.extensions);
    const selector = rule.getSelector();

    if (this.style.cssRules[i]) {
      // Selector has changed
      if (selector !== this.style.cssRules[i].selectorText) {
        this.style.deleteRule(i);
        this.style.insertRule(rule.getSelector() + '{}', i);
        result = true;
      }
    }
    else {
      this.style.insertRule(rule.getSelector() + '{}', i);
    }

    if (result) {
      css.apply(this.style.cssRules[i], rule.result);
    }
  }

  _getStateWithToggles() {
    const state = Object.create(this._state);
    state.__toggled__ = this._toggleKeys;

    return state;
  }
}
