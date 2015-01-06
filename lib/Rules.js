define([
  'mori',
  './Selectors',
  './CSSPipeline',
  './Compiler'
], function(mori, Selectors, Pipeline, Compiler) {
  'use strict';

  var map = {},

  processNode = function(selector) {
    var pipeline = map[selector];
    if (!pipeline) { return; }
    pipeline.process(this);
  };

  function update(mutations) {
    mutations.forEach(function(mutation) {
      if (!(mutation.addedNodes.length || mutation.removedNodes.length)) {
        return;
      }

      var i, affected;
      for (i = 0; i < mutation.addedNodes.length; ++i) {
        affected = Selectors.added(mutation.addedNodes[i]);
        mori.each(affected, processNode.bind(mutation.addedNodes[i]));
      }
      for (i = 0; i < mutation.removedNodes.length; ++i) {
        Selectors.removed(mutation.removedNodes[i]);
      }
    });
  }

  var observer = new MutationObserver(update);

  function watch(target) {
    observer.observe(target, {
      childList: true,
      attributes: false,
      characterData: false,
      subtree: true
    });
  }

  return {
    attach: function(root) {
      root = root || document.body;
      watch(root);
    },

    detach: function() {
      observer.disconnect();
    },

    get: function(selector) {
      return map[selector];
    },

    clear: function() {
      // Clear each Pipeline
      Object.keys(map)
      .forEach(function(selector) {
        this[selector].destroy();
        delete this[selector];
      }, map);

      // Clear cache of Operators
      Pipeline.clearCache();
    },

    process: function(selector, payload) {
      var pipe = map[selector];
      if (!pipe) { return; }
      pipe.process(Selectors.get(selector), payload);
    },

    insert: function(selector, spec) {
      var pipe = map[selector] = map[selector] ||
        (spec instanceof Pipeline ? spec : new Pipeline());

      if (typeof spec.main !== 'function') {
        spec = { main: Compiler.compile(spec) };
      }

      pipe.push(spec);
      return pipe;
    },

    plugins: Pipeline.plugins
  };
});
