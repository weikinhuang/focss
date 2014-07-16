define(['mori', 'nbd/Class', './Operator'], function(mori, Class, Operator) {
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
			this._map = mori.hash_map();
			if (arguments.length) {
				this.push.apply(this, arguments);
			}
		},

		process: function(nodes, input) {
			if (!nodes.length) {
				return this._run(this._read(nodes), input);
			}
			var i, node;
			for (i = 0; i < nodes.length; ++i) {
				node = nodes[i];
				this._run(this._read(node), input);
			}
		},

		_create: Operator,

		_read: function(key) {
			if (mori.has_key(this._map, key)) {
				return mori.get(this._map, key);
			}

			var op;
			this._map = mori.assoc(this._map, key, op = this._create(key));
			return op;
		},

		_delete: function(key) {
			this._map = mori.dissoc(this._map, key);
		},

		_run: function(operator, input) {
			var output, state, keys, values;

			for (var i = 0; i < this.length; ++i) {
				if (!this[i].main) { continue; }
				state = this[i]._state;
				try {
					this[i]._state = operator.state;
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
				operator.map(output);
			}

			if (operator._block) { return; }
			operator._block = 1;

			requestAnimationFrame(function() {
				operator.reduce();
				delete operator._block;
			}.bind(this));
		}
	});
});
