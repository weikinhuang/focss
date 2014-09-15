define(['./Pipeline', './CSSOperator'], function(Pipeline, CSSOperator)  {
  'use strict';

  return Pipeline.extend({
    _create: function(incoming) {
      return this._super(incoming, CSSOperator);
    }
  });
});
