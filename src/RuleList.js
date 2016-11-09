import Rule from './Rule';
import { computedExpression } from './RuleBase';
import MediaQuery from './MediaQuery';
import expression from './util/expression';

const foreachSelectorRegex = /%forEach\(([^,]+),(.+)\)$/i;
const filterEachSelectorRegex = /%filterEach\(([^,]+),([^,]+),(.+)\)$/i;
const mediaQueryRegex = /^@media/;
const toggleSelectorPseudoRegex = /:(hover|active)/;
const toggleSelectorClassRegex = /\.(__[^ :]+)/;
const arrayPropertyRegex = /([^<])%(?!>)(.+?)%(?!>)/g;

export default class RuleList {
  constructor() {
    this.rules = [];
    this.arrayRuleDescriptors = [];
    this.mediaQueries = [];
    this._uuid = 0;
  }

  getRules() {
    return this.rules;
  }

  getArrayRuleDescriptors() {
    return this.arrayRuleDescriptors;
  }

  getMediaQueries() {
    return this.mediaQueries;
  }

  getTraces() {
    let traces = {};

    for (let rule of this.rules) {
      for (let key in rule.traces) {
        if (rule.traces.hasOwnProperty(key)) {
          traces[key] = rule.traces[key];
        }
      }
    }

    return traces;
  }

  generateArrayRules(state, extensions) {
    this.rules = this.rules.filter(rule => !rule.isArrayRule);

    this.arrayRuleDescriptors.forEach((descriptor) => {
      this._generateRulesFromArrayRuleDescriptor(descriptor, state, extensions);
    });
  }

  insert(selector, spec) {
    let expr;

    if (mediaQueryRegex.test(selector)) {
      return this._insertMediaQuery(selector, spec);
    }

    expr = foreachSelectorRegex.exec(selector);
    if (expr !== null) {
      return this._insertArrayDescriptor(expr[2], expr[1], spec);
    }

    expr = filterEachSelectorRegex.exec(selector);
    if (expr !== null) {
      return this._insertArrayDescriptor(expr[3], expr[1], spec, expr[2]);
    }

    return this._insertSingleSelector(selector, spec);
  }

  _insertMediaQuery(selector, spec) {
    const descriptor = new MediaQuery(selector, spec);
    this.mediaQueries.push(descriptor);
    return descriptor;
  }

  _insertArrayDescriptor(selector, expr, spec, filterExpr) {
    const toggleSelectorInfo = this._getToggleSelectorInfo(selector);
    const descriptor = {
      selector: toggleSelectorInfo.selector,
      expr,
      spec,
      filterExpr,
      toggleKeys: toggleSelectorInfo.toggleKeys,
      artifacts: this._getArtifactsFromSelector(toggleSelectorInfo.selector),
    };

    descriptor.artifacts[expr] = true;
    this.arrayRuleDescriptors.push(descriptor);

    return descriptor;
  }

  _insertSingleSelector(insertedSelector, spec) {
    const { selector, toggleKeys } = this._getToggleSelectorInfo(insertedSelector);

    return this._insert({
      selector,
      spec,
      toggleKeys,
    });
  }

  _getToggleSelectorInfo(selector) {
    const toggleKeys = [];

    [toggleSelectorPseudoRegex, toggleSelectorClassRegex].forEach((toggleSelectorRegex) => {
      selector = selector.replace(toggleSelectorRegex, (match, name) => {
        const key = name + (++this._uuid);
        toggleKeys.push(key);
        return `<%__toggled__['${key}']?':not(${match})':'${match}'%>`;
      });
    });

    return {
      selector,
      toggleKeys,
    };
  }

  _getArtifactsFromSelector(selector) {
    const artifacts = {};
    let expr;

    while ((expr = computedExpression.exec(selector)) !== null) {
      Object.assign(artifacts, expression.parse(expr[1]).artifacts);
    }

    return artifacts;
  }

  _generateRulesFromArrayRuleDescriptor(descriptor, state, extensions) {
    let arrayDataFromState;
    let filterFunction;

    filterFunction = descriptor.filterExpr ? expression.compile(descriptor.filterExpr) : false;
    arrayDataFromState = expression.compile(descriptor.expr)(state, extensions);
    return arrayDataFromState.forEach((item, index) => {
      let { selector, spec, toggleKeys } = descriptor;

      if (filterFunction && !filterFunction(item)) {
        return;
      }

      let toggleSuffix = '';
      selector = selector.replace(arrayPropertyRegex, (match, firstChar, column) => {
        toggleSuffix += `_${column}_${item[column]}`;
        // The first character is captured and replaced as a workaround for JS not having regex lookbehinds
        return `${firstChar}${item[column]}`;
      });

      toggleKeys = toggleKeys.map((toggleKey) => {
        const newToggleKey = toggleKey + toggleSuffix;
        selector = selector.replace(`${toggleKey}']?`, `${newToggleKey}']?`);
        return newToggleKey;
      });

      this._insert({
        selector,
        spec,
        toggleKeys,
        arrayMemberExpr: `${descriptor.expr}[${index}]`,
        togglePrefix: `${descriptor.expr}.${index}.`,
      });
    });
  }

  _insert(ruleData) {
    const rule = new Rule(ruleData);
    this.rules.push(rule);
    return rule;
  }
}
