define(['mori', 'nbd/Class', 'nbd/util/async', './Operator'], function(mori, Class, async, Operator) {
	'use strict';

	var requestAnimationFrame = window.requestAnimationFrame || async,
	arr = Array.prototype,
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
			this._opcache = mori.hash_map();
			this._operators = mori.set();
			if (arguments.length) {
				this.push.apply(this, arguments);
			}
		},

		process: function(nodes, input) {
			var i, node, op, ops = [];
			if (!nodes.length) {
				op = this._read(nodes);
				this._run(op, input);
				ops.push(op);
			}
			else {
				for (i = 0; i < nodes.length; ++i) {
					node = nodes[i];
					op = this._read(node);
					this._run(op, input);
					ops.push(op);
				}
			}
			ops.unshift(this._operators);
			this._operators = mori.conj.apply(null, ops);
			ops.length = 0;

			if (this._block) { return; }
			this._block = 1;

			requestAnimationFrame(function step() {
				mori.each(this._operators, function reduction(op) {
					op.reduce();
				});
				delete this._block;
			}.bind(this));
		},

		commit: function(nodes) {
			if (!nodes.length) {
				return this._read(nodes).commit();
			}
			var i, node;
			for (i = 0; i < nodes.length; ++i) {
				node = nodes[i];
				this._read(node).commit();
			}
		},

		revert: function(nodes, n) {
			if (!nodes.length) {
				return this._read(nodes).revert(n);
			}
			var i, node;
			for (i = 0; i < nodes.length; ++i) {
				node = nodes[i];
				this._read(node).revert(n);
			}
		},

		_create: Operator,

		_read: function(key) {
			if (mori.has_key(this._opcache, key)) {
				return mori.get(this._opcache, key);
			}

			var op;
			this._opcache = mori.assoc(this._opcache, key, op = this._create(key));
			return op;
		},

		_delete: function(key) {
			this._opcache = mori.dissoc(this._opcache, key);
		},

		_run: function(operator, input) {
			var output, state, keys, values;

			for (var i = 0; i < this.length; ++i) {
				if (!this[i].main) { continue; }

				state = this[i]._state;
				this[i]._state = operator.state;
				output = this[i].main(input, mori);
				this[i]._state = state;

				if (!output) { continue; }
				operator.map(output);
			}
		}
	});
});
