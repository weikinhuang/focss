define([
	'mori',
	'lib/Selectors',
	'lib/Pipeline'
], function(mori, Selectors, Pipeline) {
	'use strict';

	var map = {},
	selectorMap = {},

	processNode = function(selector) {
		var id, pipelines = selectorMap[selector];
		if (!pipelines) { return; }

		for (id in pipelines) {
			pipelines[id].pipeline.process(this);
		}
	};

	function uid(p) {
		return (p || '') + (++uid.counter);
	}
	uid.counter = 0;

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

		process: function(id, payload) {
			var tuple = map[id];
			if (!tuple) { return; }
			tuple.pipeline.process(Selectors.get(tuple.selector), payload);
		},

		insert: function(selector, pipe) {
			var id;
			if (pipe instanceof Pipeline) {
				id = uid();
				map[id] = {
					selector: selector,
					pipeline: pipe
				};
				selectorMap[selector] = selectorMap[selector] || {};
				selectorMap[selector][id] = map[id];
				return id;
			}
		}
	};
});
