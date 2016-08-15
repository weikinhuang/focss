/* global Symbol */
import Class from 'nbd/Class';
import Rule from './Rule';
import Style from './Style';
import css from '../util/css';
import expression from '../util/expression';

function getVendorPrefixRegex() {
  var otherVendorPrefixesMap = {
    moz: ['webkit', 'ms'],
    webkit: ['moz', 'ms'],
    ms: ['webkit', 'moz'],
  };
  var ua = navigator.userAgent.toLowerCase();
  var vendorPrefix = ua.indexOf('trident') > -1 ? 'ms' : (ua.indexOf('webkit') > -1 ? 'webkit' : 'moz');
  var otherVendorPrefixes = otherVendorPrefixesMap[vendorPrefix];

  return new RegExp(':-(' + otherVendorPrefixes.join('|') + ')-');
}

var hasDom = typeof window !== 'undefined';
var arrayPropertyRegex = /%([^%]+?)%/g;
var foreachSelectorRegex = /%forEach\(([^,]+),(.+)\)$/i;
var filterEachSelectorRegex = /%filterEach\(([^,]+),([^,]+),(.+)\)$/i;
var mediaQueryRegex = /^@media/;
var toggleSelectorPsuedoRegex = /:(hover|active)/;
var toggleSelectorClassRegex = /\.(__[^ :]+)/;
var otherPrefixRegex = hasDom ? getVendorPrefixRegex() : new RegExp();
var Engine;

Engine = Class.extend({
  init(root) {
    this.variables = {};
    this.rules = [];
    this.arrayRuleDescriptors = [];
    this.mediaQueries = [];
    this.extensions = Object.create(this.extensions);
    this.traces = {};
    this._toggleKeys = {};
    this._uuid = 0;

    if (hasDom) {
      this.style = new Style(root);
    }
  },

  destroy() {
    this.rules.length = 0;

    if (this.style) {
      this.style.destroy();
    }
  },

  process(payload) {
    if (!hasDom) {
      return;
    }

    this._state = Object.assign({}, payload, { __var: this.variables });
    this._regenerateArrayRules();
    this.rules.forEach(this._process, this);

    // remove leftover rules
    for (var i = this.style.cssRules.length; i > this.rules.length; i--) {
      this.style.deleteRule(i - 1);
    }
  },

  toString(payload) {
    let result = '';
    let mediaQueryResult = '';

    this._state = Object.assign({}, payload, { __var: this.variables });
    this._regenerateArrayRules();

    for (let rule of this.rules) {
      rule.process(this._getStateWithToggles(), this.extensions);
      result += css.toString(rule.getSelector(), rule.result);
    }

    for (let query of this.mediaQueries) {
      this._regenerateArrayRules(query);
      mediaQueryResult += `${query.selector}{`;

      for (let rule of query.rules) {
        rule.process(this._getStateWithToggles(), this.extensions);
        mediaQueryResult += css.toString(rule.getSelector(), rule.result);
      }

      mediaQueryResult += '}';
    }

    return result + mediaQueryResult;
  },

  toggleSelector(key, isToggled) {
    var isCurrentlyToggled = this._toggleKeys[key] || false;
    this._toggleKeys[key] = isToggled;

    if (isToggled !== isCurrentlyToggled) {
      this.process(this._state);
    }
  },

  _getToggleSelectorInfo(selector) {
    var toggleKeys = [];
    var self = this;

    [toggleSelectorPsuedoRegex, toggleSelectorClassRegex].forEach(function(toggleSelectorRegex) {
      selector = selector.replace(toggleSelectorRegex, function(match, name) {
        var key = name + (++self._uuid);
        toggleKeys.push(key);
        return "${__toggled__['" + key + "']?':not(" + match + ")':'" + match + "'}";
      });
    });

    return {
      selector,
      toggleKeys
    };
  },

  _getStateWithToggles() {
    var state = Object.create(this._state);
    state.__toggled__ = this._toggleKeys;

    return state;
  },

  _process(rule, i) {
    var result = rule.process(this._getStateWithToggles(), this.extensions);
    var selector = rule.getSelector();

    // Selector has changed
    if (selector !== this.style.cssRules[i].selectorText) {
      this.style.deleteRule(i);
      this.style.insertRule(rule.getSelector() + '{}', i);
      result = true;
    }

    if (result) {
      css.apply(this.style.cssRules[i], rule.result);
    }
  },

  insert(selector, spec) {
    if (mediaQueryRegex.test(selector)) {
      return this._insertMediaQuery(selector, spec);
    }

    return this._insertByType(selector, spec);
  },

  _insertByType(selector, spec, rulesContext = this) {
    var expr;

    // ignore rules that contain the other vendor prefix, as trying to
    // insert them into a stylesheet will cause an exception to be thrown
    // @see: http://stackoverflow.com/questions/23050001/insert-multiple-css-rules-into-a-stylesheet
    if (hasDom && otherPrefixRegex.test(selector)) {
      return {
        artifacts: {}
      };
    }

    expr = foreachSelectorRegex.exec(selector);
    if (expr !== null) {
      return this._insertArrayDescriptor(expr[2], expr[1], spec, null, rulesContext);
    }

    expr = filterEachSelectorRegex.exec(selector);
    if (expr !== null) {
      return this._insertArrayDescriptor(expr[3], expr[1], spec, expr[2], rulesContext);
    }

    return this._insertSingleSelector(selector, spec, rulesContext);
  },

  insertVars(spec) {
    Object.assign(this.variables, spec);
  },

  _insertSingleSelector(insertedSelector, spec, ruleContext) {
    const { selector, toggleKeys } = this._getToggleSelectorInfo(insertedSelector);

    return this._insertRule({
      selector,
      spec,
      toggleKeys
    }, ruleContext);
  },

  _insertMediaQuery(selector, spec) {
    const descriptor = {
      selector,
      rules: [],
      arrayRuleDescriptors: [],
      artifacts: {}
    };

    for (let rule in spec) {
      let { artifacts } = this._insertByType(rule, spec[rule], descriptor);
      Object.assign(descriptor.artifacts, artifacts);
    }
    this.mediaQueries.push(descriptor);

    return descriptor;
  },

  _insertArrayDescriptor(selector, expr, spec, filterExpr, rulesContext) {
    var toggleSelectorInfo = this._getToggleSelectorInfo(selector);
    var descriptor = {
      selector: toggleSelectorInfo.selector,
      expr,
      spec,
      filterExpr,
      toggleKeys: toggleSelectorInfo.toggleKeys,
      artifacts: this._getArtifactsFromSelector(toggleSelectorInfo.selector)
    };

    descriptor.artifacts[expr] = true;

    this._generateRulesFromArrayRuleDescriptor(descriptor, rulesContext);
    rulesContext.arrayRuleDescriptors.push(descriptor);

    return descriptor;
  },

  _regenerateArrayRules(rulesContext = this) {
    rulesContext.rules = rulesContext.rules.filter(function(rule) {
      return !rule.isArrayRule;
    }, this);

    rulesContext.arrayRuleDescriptors.forEach(function(descriptor) {
      this._generateRulesFromArrayRuleDescriptor(descriptor, rulesContext);
    }, this);
  },

  _getArtifactsFromSelector(selector) {
    var artifacts = {};
    var expr;

    while ((expr = this.constructor.Rule.computed.exec(selector)) !== null) {
      Object.assign(artifacts, expression.parse(expr[1]).artifacts);
    }

    return artifacts;
  },

  _generateRulesFromArrayRuleDescriptor(descriptor, ruleContext) {
    let arrayDataFromState;
    let filterFunction;

    // occurs when .insert is called before .process
    if (!this._state) {
      return;
    }

    filterFunction = descriptor.filterExpr ? expression.compile(descriptor.filterExpr) : false;

    arrayDataFromState = expression.compile(descriptor.expr)(this._state, this._extensions);
    arrayDataFromState.forEach((item, index) => {
      let { selector, spec, toggleKeys } = descriptor;

      // Filtering must happen here instead of a separate filter step to ensure that
      // `index` is consistent between the data from process and the index provided to _insertRule below
      if (filterFunction && !filterFunction(item)) {
        return;
      }

      let toggleSuffix = '';
      selector = selector.replace(arrayPropertyRegex, (match, column) => {
        toggleSuffix += '_' + column + '_' + item[column];
        return item[column];
      });

      toggleKeys = toggleKeys.map((toggleKey) => {
        const newToggleKey = toggleKey + toggleSuffix;
        selector = selector.replace(`${toggleKey}']?`, `${newToggleKey}']?`);
        return newToggleKey;
      });

      this._insertRule({
        selector,
        spec,
        toggleKeys,
        arrayMemberExpr: `${descriptor.expr}[${index}]`,
        togglePrefix: `${descriptor.expr}.${index}.`
      }, ruleContext);
    });
  },

  getTraces() {
    let traces = {};

    for (let rule of this.rules) {
      for (let key in rule.traces) {
        if (rule.traces.hasOwnProperty(key)) {
          traces[key] = rule.traces[key];
        }
      }
    }

    return traces;
  },

  _insertRule(ruleData, { rules }) {
    const rule = new this.constructor.Rule(ruleData);
    const i = this.rules.length;

    if (hasDom) {
      if (rule.isComputed) {
        // Placeholder rule
        this.style.insertRule(':root {}', i);
      }
      else {
        this.style.insertRule(rule.getSelector() + '{}', i);
      }
    }

    rules.push(rule);
    return rule;
  },

  extensions: {
    Math,
    Number
  }
}, {
  Rule,
  displayName: 'FocssEngine'
});

// ES6 future-proofing
if (typeof Symbol !== 'undefined' && Symbol.iterator) {
  Engine.prototype[Symbol.iterator] = function() {
    return {
      _keys: this.rules.slice(),
      next() {
        var rule;
        if (rule = this._keys.shift()) {
          return {
            value: rule,
            done: false
          };
        }
        return { done: true };
      }
    };
  };
}

export default Engine;
