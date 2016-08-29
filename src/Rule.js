import RuleBase from './RuleBase';
import expression from '../util/expression';

// CSS3 introduces the double colon syntax for pseudos
const css2PseudoEl = /:(after|before|first-letter|first-line)|::/g;
function prefixPseudo(a, b) { return b ? ':' + a : a; }
function normalizePseudoElement(selector) {
  return selector.replace(css2PseudoEl, prefixPseudo);
}

export default class Rule extends RuleBase {
  constructor({ selector, spec, arrayMemberExpr, toggleKeys, togglePrefix = '' }) {
    if (typeof selector !== 'string') {
      throw new TypeError('selector must be a string.');
    }
    super();
    this.selector = normalizePseudoElement(selector);
    this.body = expression.compileSpec(spec, arrayMemberExpr);
    this.artifacts = Object.assign({}, this.body.artifacts);
    this.isArrayRule = !!arrayMemberExpr;

    const { isComputed, artifacts } = this._extractArtifactsFromSelector(this.selector);
    this.isComputed = isComputed;
    Object.assign(this.artifacts, artifacts);

    if (toggleKeys) {
      this.traces = {};
      const artifactsPrefixed = {};
      for (let key in this.artifacts) {
        if (key.indexOf('__toggled__') !== 0) {
          artifactsPrefixed[`${togglePrefix}${key}`] = this.artifacts[key];
        }
      }

      for (let key of toggleKeys) {
        this.traces[key] = artifactsPrefixed;
      }
    }
  }

  _processBody(data, extensions) {
    this.result = this.body(data, extensions);
  }
}

