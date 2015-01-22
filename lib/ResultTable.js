define([
  'nbd/Class',
  'nbd/util/extend',
  '../util/css'
], function(Class, extend, css) {
  'use strict';

  function bySpecificity(a, b) {
    return (a.s - b.s) || (a.i - b.i);
  }
  function mergeResult(target, intermediary) {
    return extend(target, intermediary.r);
  }

  /**
   * @requires Set
   * @requires WeakMap
   * @requires requestAnimationFrame
   */
  var ResultTable = Class.extend({
    init: function() {
      this._affecting = new WeakMap();
      this._states = new WeakMap();
    },

    get: function(el) {
      var affecting = this._affecting.get(el);
      if (!affecting) {
        this._affecting.set(el, affecting = new Set());
        affecting.add({ result: css.extract(el) });
      }

      this.mark(el);
      return affecting;
    },

    mark: function(el) {
      if (!this._dirty) {
        this._dirty = new Set();
        requestAnimationFrame(this.sweep.bind(this));
      }

      this._dirty.add(el);
    },

    sweep: function() {
      this._dirty.forEach(this._reduce, this);
      this._dirty.clear();
      this._dirty = null;
    },

    _reduce: function reduce(el) {
      var affecting = this._affecting.get(el);
      if (!affecting) { return; }

      // ES7: [ for (let {result} of affecting) result ].reduce(extend, {})
      // must be ordered by specificity
      // TODO: this is super ugly
      var _results = [], i = 0;
      affecting.forEach(function(layer) {
        var specificity = 0;
        if (layer.specificity) {
          // Only one selector (no commas)
          if (layer.specificity.length === 1) {
            specificity = layer.specificity[0].specificity;
          }
          else {
            // Find matching selector
            layer.specificity.some(function(s) {
              var matches = css.matches(el, s.selector);
              if (matches) {
                specificity = s.specificity;
              }
              return matches;
            });
          }
        }
        _results.push({
          s: specificity,
          r: layer.result,
          i: i++
        });
      });
      var sum = _results.sort(bySpecificity).reduce(mergeResult, {});

      var last = this._states.get(el) || {};
      this._states.set(el, sum);

      var result = extend({}, sum);
      // Unset previous properties
      for (var prop in last) {
        if (!result.hasOwnProperty(prop)) {
          result[prop] = '';
        }
      }

      css.apply(el, result);
    },

    remove: function(el) {
      this._affecting.delete(el);
      this._states.delete(el);
    },

    destroy: function() {
      this._affecting = null;
      this._states = null;
    }
  });

  return ResultTable;
});
