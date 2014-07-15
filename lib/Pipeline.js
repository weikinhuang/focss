define(['mori', 'nbd/Class'], function(mori, Class) {
	'use strict';

	var arr = Array.prototype,
	get = function(key) {
		return this[key];
	};

	return Class.extend({
		length: 0,
		pop: arr.pop,
		push: arr.push,
		shift: arr.shift,
		unshift: arr.unshift,
		splice: arr.splice
	})
	.extend({
		init: function() {
			if (arguments.length) {
				this.push.apply(this, arguments);
			}
		},

		process: function(input) {
			var output, state, keys, values;
			for (var i = 0; i < this.length; ++i) {
				if (!this[i].main) { continue; }
				state = this[i]._state;
				try {
					this[i]._state = this._operator.state;
					output = this[i].main(input, mori);
				} finally {
					this[i]._state = state;
				}
				if (!output) { continue; }
				if (!(Array.isArray(output) || mori.is_associative(output))) {
					keys = Object.keys(output);
					values = keys.map(get, output);
					output = mori.zipmap(keys, values);
				}
				this._operator.map(output);
			}

			if (this.block) { return; }
			this.block = 1;

			requestAnimationFrame(function() {
				this._operator.reduce();
				delete this.block;
			}.bind(this));
		}
	});
});
