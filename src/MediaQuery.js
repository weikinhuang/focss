import RuleBase from './RuleBase';
import RuleList from './RuleList';
import css from '../util/css';

export default class MediaQuery extends RuleBase {
  constructor(selector, spec) {
    super();
    this.selector = selector;
    this.rules = new RuleList();
    this.artifacts = {};

    const { isComputed, artifacts } = this._extractArtifactsFromSelector(this.selector);
    this.isComputed = isComputed;
    Object.assign(this.artifacts, artifacts);

    for (let rule of spec) {
      const { selector, rules } = rule;
      const { artifacts } = this.rules.insert(selector, rules);
      Object.assign(this.artifacts, artifacts);
    }
  }

  _processBody(data, extensions) {
    this.rules.generateArrayRules(data, extensions);

    let result = '';
    for (let rule of this.rules.getRules()) {
      rule.process(data, extensions);
      result += css.toString(rule.getSelector(), rule.result);
    }
    this.result = result;
  }
}
