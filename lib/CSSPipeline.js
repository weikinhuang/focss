define(['./Pipeline', './CSSOperator'], function(Pipeline, CSSOperator)  {
	'use strict';

	return Pipeline.extend({
		_create: CSSOperator
	});
});
