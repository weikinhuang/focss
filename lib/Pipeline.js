define([
	'mori',
	'nbd/Class',
	'nbd/util/async',
	'./Operator'
], function(mori, Class, async, Operator) {
	'use strict';

	var requestAnimationFrame = window.requestAnimationFrame || async,
	arr = Array.prototype;

	function reduction(op) {
		op.apply(op.reduce());
	}

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
				mori.each(this._operators, reduction);
				this._operators = mori.empty(this._operators);
				var callback = this._block;
				delete this._block;
				if (typeof callback === 'function') {
					callback.call(this);
				}
			}.bind(this));
		},

		commit: function commit(nodes) {
			if (this._block) {
				this._block = commit.bind(this, nodes);
				return;
			}
			if (!nodes.length) {
				this._read(nodes).commit();
				return;
			}
			var i, node;
			for (i = 0; i < nodes.length; ++i) {
				node = nodes[i];
				this._read(node).commit();
			}
		},

		revert: function(nodes, n) {
			var i, node;
			if (!nodes.length) {
				node = this._read(nodes);
				node.apply(node.revert(n));
				return;
			}
			for (i = 0; i < nodes.length; ++i) {
				node = this._read(nodes[i]);
				node.apply(node.revert(n));
			}
		},

		_create: function(incoming, OpClass) {
			OpClass = OpClass || Operator;
			var inst = new OpClass();
			inst.load(inst.transform(inst.extract(incoming)));
			return inst;
		},

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
			var output, state;

			for (var i = 0; i < this.length; ++i) {
				if (!this[i].main) { continue; }

				state = this[i].state;
				this[i].state = operator.state;
				output = this[i].main(input);
				this[i].state = state;

				if (!output) { continue; }
				operator.map(output);
			}
		}
	});
});
