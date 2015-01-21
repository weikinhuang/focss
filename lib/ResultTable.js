define([
  'nbd/Class',
  'nbd/util/extend',
  './css'
], function(Class, extend, css) {
  'use strict';

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

      // ES7: [ for (let {result} of affecting) result ].reduce(extend, sum)
      var sum = {};
      affecting.forEach(function(layer) {
        extend(sum, layer.result);
      });

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
