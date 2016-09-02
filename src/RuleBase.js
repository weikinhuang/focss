import diff from 'nbd/util/diff';
import expression from './util/expression';

export const computedExpression = /\$\{([^\}]*?)\}|<%\s*(.*?)\s*%>/ig;

export default class RuleBase {
  getSelector() {
    return this.computedSelector || this.selector;
  }

  process(data, extensions) {
    this._processSelector(data, extensions);
    this._processBody(data, extensions);

    let different;
    if (typeof this.result === 'object') {
      different = !this._lastResult ||
        Object.keys(diff(this.result, this._lastResult)).length;
    }
    // Processing a MediaQuery produces a string
    else if (typeof this.result === 'string') {
      different = !this._lastResult ||
        this.result !== this._lastResult;
    }

    this._lastResult = this.result;
    return different ? this.result : null;
  }

  _extractArtifactsFromSelector(selector) {
    let isComputed = false;
    let artifacts = {};
    let expr;
    // Perform a while loop here because a computed selector can
    // contain *multiple* template strings in a row.
    while ((expr = computedExpression.exec(selector)) !== null) {
      isComputed = true;
      Object.assign(artifacts, expression.parse(expr[1] || expr[2]).artifacts);
    }

    return { isComputed, artifacts };
  }

  _processSelector(data, extensions) {
    let selector = this.selector;

    if (this.isComputed) {
      selector = this.selector.replace(computedExpression, (match, oldExpr, newExpr) => {
        const expr = oldExpr || newExpr;
        return expression.compile(expr)(data, extensions);
      });
    }

    this.computedSelector = selector;
  }

  _processBody() {
    throw new Error('_processBody must be implemented in a subclass.');
  }
}
