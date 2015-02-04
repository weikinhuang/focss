define([
  'nbd/Class',
  'nbd/trait/pubsub',
  'nbd/util/extend',
  '../util/css'
], function(Class, pubsub, extend, css) {
  'use strict';

  function bySpecificity(a, b) {
    return (a.specificity - b.specificity) || (a.index - b.index);
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
      this._dirty = new Set();
    },

    get: function(el) {
      var affecting = this._affecting.get(el);
      if (!affecting) {
        this._affecting.set(el, affecting = new Set());
        affecting.base = css.extract(el);
      }

      this.mark(el);
      return affecting;
    },

    mark: function(el) {
      if (this._dirty.size === 0) {
        requestAnimationFrame(this.sweep.bind(this));
      }
      this._dirty.add(el);
    },

    sweep: function() {
      this._dirty.forEach(this._reduce.bind(this));
      if (this._dirty.size) {
        this.trigger('sweep');
      }
      this._dirty.clear();
    },

    _intermediates: function(el, affecting) {
      // must be ordered by specificity
      // TODO: this is super ugly
      var _results = [], i = 0;
      affecting.forEach(function findSpecificity(layer) {
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
          specificity: specificity,
          result: layer.result,
          index: i++
        });
      });

      return _results;
    },

    _reduce: function reduce(el) {
      var affecting = this._affecting.get(el);
      if (!affecting) { return; }

      // element, set, previous
      var sum = Object.create(affecting.base),
          last = this._states.get(el);

      if (affecting.size) {
        var intermediate = this._intermediates(el, affecting).sort(bySpecificity);

        for (var i = 0; i < intermediate.length; ++i) {
          extend(sum, intermediate[i].result);
        }
        this._states.set(el, sum);
      }
      else {
        // Cull non-affected nodes
        this.remove(el);
      }

      // Unset previous properties
      for (var prop in last) {
        if (!sum.hasOwnProperty(prop)) {
          sum[prop] = '';
        }
      }

      css.apply(el, sum);
    },

    remove: function(el) {
      this._affecting.delete(el);
      this._states.delete(el);
      this._dirty.delete(el);
    },

    destroy: function() {
      this._dirty.clear();
      this._dirty = null;
      this._affecting = null;
      this._states = null;
    }
  })
  .mixin(pubsub);

  return new ResultTable();
});
