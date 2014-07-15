define(['mori', 'nbd/Class', 'nbd/util/pipe'], function(mori, Class, pipe) {
	'use strict';

	return Class.extend({
		init: function(incoming) {
			this.delta = [];
			pipe(this.extract, this.transform, this.load)
			.call(this, incoming);
		},

		extract: function(input) {
			return input;
		},

		transform: function(input) {
			return mori.js_to_clj(input);
		},

		load: function(input) {
			this.states = mori.is_vector(this.states) ?
				mori.conj(this.states, input) :
				this.states = mori.vector(input);
		},

		map: function(change) {
			change = mori.is_map(change) ?
				change :
				mori.hash_map.apply(null, change);
			this.delta.push(change);
			return this;
		},

		reduce: function() {
			this.state = this.state || mori.peek(this.states);
			if (this.delta.length) {
				this.delta.unshift(this.state);
				this.state = mori.merge.apply(null, this.delta);
				this.delta.length = 0;
			}
			this.apply();
			return this;
		},

		apply: function() {},

		commit: function() {
			if (!mori.is_collection(this.state)) {
				throw new TypeError('this.state is not a collection');
			}
			this.load(this.state);
			return this;
		},

		revert: function(n) {
			n = n|0;
			var len = mori.count(this.states);
			if (n && len > n) {
				this.states = mori.subvec(this.states, 0, len - (n|0));
			}
			this.state = mori.peek(this.states);
			this.apply();
			return this;
		}
	});
});
