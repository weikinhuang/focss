/* global Symbol */
define([
  'nbd/Class',
  './Rule',
  './eltable',
  '../util/css'
], function(Class, Rule, eltable, css) {
  'use strict';

  /**
   * @requires MutationObserver
   */
  var Engine = Class.extend({
    init: function() {
      this.observer = new MutationObserver(this._update.bind(this));
      this.rules = [];
    },

    bind: function(root) {
      var target = root || document.body;
      this.observer.observe(target, {
        childList: true,
        attributes: true,
        characterData: false,
        subtree: true
      });
    },

    destroy: function() {
      this.observer.disconnect();
      this.observer = null;
      this.rules.forEach(function(rule) {
        rule.destroy();
      });
      this.rules.length = 0;
    },

    /**
     * Context-bound mutation update callback
     */
    _update: function mutationUpdate(mutations, observer) {
      var mutation, i, target, j;
      for (i = 0; i < mutations.length; ++i) {
        mutation = mutations[i];
        if (mutation.type === 'attributes' && mutation.attributeName !== "style") {
          this._markMutated(mutation.target);
          continue;
        }
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          this._markMutated.apply(this, mutation.addedNodes);
        }
        if (mutation.type === 'childList' && mutation.removedNodes.length) {
          for (j = 0; target = mutation.removedNodes[j]; ++j) {
            eltable.remove(target);
          }
        }
      }
    },

    _markMutated: function(target) {
      var rule, i;

      for (i = 0; rule = this.rules[i]; ++i) {
        if (rule.computedSelector) {
          rule.mark();
        }
      }
    },

    process: function(payload) {
      this._state = payload;

      // for (let rule of this) rule.process(payload)
      this.rules.forEach(function(rule) {
        rule.process(this._state);
      }, this);
    },

    insert: function(selector, spec) {
      var rule = new this.constructor.Rule(selector, spec);
      this.rules.push(rule);

      if (this._state) {
        rule.process(this._state);
      }
      return rule;
    }
  }, {
    Rule: Rule,
    displayName: 'FocssEngine'
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
