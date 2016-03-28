/* global Symbol */
define([
  'nbd/Class',
  'nbd/util/extend',
  './Rule',
  '../util/css',
  '../util/detectScoped',
  '../util/expression'
], function(Class, extend, Rule, css, compat, expression) {
  'use strict';

  function genId() {
    return '__focss__' + genId.i++;
  }
  genId.i = 1;

  function getVendorPrefixRegex() {
    var otherVendorPrefixesMap = {
          moz: ['webkit', 'ms'],
          webkit: ['moz', 'ms'],
          ms: ['webkit', 'moz'],
        },
        ua = navigator.userAgent.toLowerCase(),
        vendorPrefix = ua.indexOf('trident') > -1 ? 'ms' : ( ua.indexOf('webkit') > -1 ? 'webkit' : 'moz' ),
        otherVendorPrefixes = otherVendorPrefixesMap[vendorPrefix];

    return new RegExp(':-(' + otherVendorPrefixes.join('|') + ')-');
  }

  var arrayPropertyRegex = /%([^%]+?)%/g,
      foreachSelectorRegex = /%forEach\(([^,]+),(.+)\)$/i,
      filterEachSelectorRegex = /%filterEach\(([^,]+),([^,]+),(.+)\)$/i,
      toggleSelectorPsuedoRegex = /:(hover|active)/,
      toggleSelectorClassRegex = /\.(__[^ ]+)/,
      otherPrefixRegex = getVendorPrefixRegex(),
      Engine;

  Engine = Class.extend({
    init: function(root, scoped) {
      var target = root || document.body;

      this.rules = [];
      this.arrayRuleDescriptors = [];
      this.extensions = Object.create(this.extensions);
      this.style = document.createElement('style');
      this.traces = {};

      this._toggleSelectorKeys = {};
      this._uuid = 0;

      if (scoped) {
        this.style.setAttribute('scoped', 'scoped');
      }

      target.insertBefore(this.style, target.firstChild);

      if (!scoped || compat.scopeSupported || target === document.body) {
        this._prefix = '';
      }
      else {
        this._prefix = '#' + (root.id || (root.id = genId())) + ' ';
      }
    },

    destroy: function() {
      this.rules.length = 0;
      this.style.parentNode.removeChild(this.style);
    },

    process: function(payload) {
      this._state = payload;
      this._regenerateArrayRules();
      this.rules.forEach(this._process, this);

      //remove leftover rules
      for (var i = this.cssRules.length; i > this.rules.length; i--) {
        this.sheet.deleteRule(i - 1);
      }
    },

    toggleSelector: function(key, isToggled) {
      var isCurrentlyToggled = this._toggleSelectorKeys[key];
      this._toggleSelectorKeys[key] = isToggled;

      if (isToggled !== isCurrentlyToggled) {
        this.process(this._state);
      }
    },

    _getToggleSelectorInfo: function(selector) {
      var toggleSelectorKeys = [],
          self = this;

      [toggleSelectorPsuedoRegex, toggleSelectorClassRegex].forEach(function(toggleSelectorRegex) {
        selector = selector.replace(toggleSelectorRegex, function(match, name) {
          var key = name + (++self._uuid);
          toggleSelectorKeys.push(key);
          return "${__toggled__." + key + "?':not(" + match + ")':'" + match + "'}";
        });
      });

      return {
        selector: selector,
        toggleSelectorKeys: toggleSelectorKeys
      };
    },

    _getStateWithToggles: function() {
      var state = Object.create(this._state);
      state.__toggled__ = this._toggleSelectorKeys;

      return state;
    },

    _process: function(rule, i) {
      var result = rule.process(this._getStateWithToggles(), this.extensions),
          selector = rule.getSelector(this._prefix);

      // Selector has changed
      if (selector !== this.cssRules[i].selectorText) {
        if (compat.changeSelectorTextAllowed) {
          this.cssRules[i].selectorText = selector;
        }
        else {
          this.sheet.deleteRule(i);
          this.sheet.insertRule(rule.getSelector(this._prefix) + '{}', i);
          // If the rule has been replaced, we must re-apply the rule body
          result = true;
        }
      }

      // Results have changed
      if (result) {
        css.apply(this.cssRules[i], rule.result);
      }
    },

    insert: function(selector, spec) {
      var expr;

      // ignore rules that contain the other vendor prefix, as trying to
      // insert them into a stylesheet will cause an exception to be thrown
      // @see: http://stackoverflow.com/questions/23050001/insert-multiple-css-rules-into-a-stylesheet
      if (otherPrefixRegex.test(selector)) {
        return {
          artifacts: {}
        };
      }

      expr = foreachSelectorRegex.exec(selector);
      if (expr !== null) {
        return this._insertArrayDescriptor(expr[2], expr[1], spec);
      }

      expr = filterEachSelectorRegex.exec(selector);
      if (expr !== null) {
        return this._insertArrayDescriptor(expr[3], expr[1], spec, expr[2]);
      }

      return this._insertPossibleToggleSelector(selector, spec);
    },

    _insertPossibleToggleSelector: function(selector, spec) {
      var selectorInfo = this._getToggleSelectorInfo(selector),
          rule = this._insert(selectorInfo.selector, spec),
          self = this,
          key;

      selectorInfo.toggleSelectorKeys.forEach(function(key) {
        self.traces[key] = rule.artifacts;
      });

      return rule;
    },

    _insertArrayDescriptor: function(selector, expr, spec, filterExpr) {
      var descriptor = {
            selector: selector,
            expr: expr,
            spec: spec,
            filterExpr: filterExpr
          },
          artifacts = this._generateRulesFromArrayRuleDescriptor(descriptor);

      artifacts[expr] = true;

      this.arrayRuleDescriptors.push(descriptor);

      return {
        artifacts: artifacts
      };
    },

    _regenerateArrayRules: function() {
      this.rules = this.rules.filter(function(rule) {
        return !rule.isArrayRule;
      }, this);

      this.arrayRuleDescriptors.forEach(function(descriptor) {
        this._generateRulesFromArrayRuleDescriptor(descriptor);
      }, this);
    },

    _getArtifactsFromSelector: function(selector) {
      var artifacts = {},
          expr;

      while ((expr = this.constructor.Rule.computed.exec(selector)) !== null) {
        extend(artifacts, expression.parse(expr[1]).artifacts);
      }

      return artifacts;
    },

    _generateRulesFromArrayRuleDescriptor: function(descriptor) {
      var artifacts = this._getArtifactsFromSelector(descriptor.selector),
          arrayDataFromState,
          filterFunction;

      // occurs when .insert is called before .process
      if (!this._state) {
        return artifacts;
      }

      filterFunction = descriptor.filterExpr ? expression.compile(descriptor.filterExpr) : false;

      arrayDataFromState = expression.compile(descriptor.expr)(this._state, this._extensions);
      arrayDataFromState.forEach(function(item, index) {
        // Filtering must happen here instead of a separate filter step to ensure that
        // `index` is consistent between the data from process and the index provided to _insert below
        if (filterFunction && !filterFunction(item)) {
          return;
        }

        var selectorForItem = descriptor.selector.replace(arrayPropertyRegex, function(match, column) {
          return item[column];
        });

        this._insert(selectorForItem, descriptor.spec, descriptor.expr + '[' + index + ']');
      }, this);

      return artifacts;
    },

    _insert: function(selector, spec, arrayMemberExpr) {
      var rule = new this.constructor.Rule(selector, spec, arrayMemberExpr),
          i = this.rules.length;

      if (rule.isComputed) {
        // Placeholder rule
        this.sheet.insertRule(':root {}', i);
      }
      else {
        this.sheet.insertRule(rule.getSelector(this._prefix) + '{}', i);
      }
      this.rules.push(rule);

      if (this._state) {
        this._process(rule, i);
      }
      return rule;
    },

    extensions: {
      Math: Math
    }
  }, {
    Rule: Rule,
    displayName: 'FocssEngine'
  })
  .mixin({
    get sheet() {
      return this.style[compat.sheet];
    },
    get cssRules() {
      return this.sheet[compat.rules];
    }
  });

  // ES6 future-proofing
  if (typeof Symbol !== 'undefined' && Symbol.iterator) {
    Engine.prototype[Symbol.iterator] = function() {
      return {
        _keys: this.rules.slice(),
        next: function() {
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

  return Engine;
});
