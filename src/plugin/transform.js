import { replaceVariables } from './util';

export default function transform(ast, variables = {}) {
  const descriptors = [];
  variables = Object.assign({}, variables);

  ast.each((node) => {
    const definedVarRegex = /^\$[\w\d-]+/;
    const descriptor = {};

    if (node.type === 'rule') {
      descriptor.selector = replaceVariables(node, node.selector, variables);
      descriptor.rules = {};

      node.walkDecls((declNode) => {
        descriptor.rules[declNode.prop] = replaceVariables(declNode, declNode.value, variables);
      });
    }
    else if (node.type === 'atrule' && node.name === 'media') {
      descriptor.selector = `@media ${replaceVariables(node, node.params, variables)}`;
      descriptor.rules = [];

      node.walkRules((ruleNode) => {
        const ruleDescriptor = {
          selector: replaceVariables(ruleNode, ruleNode.selector.replace(/\n/g, ' '), variables),
          rules: {},
        };

        ruleNode.walkDecls((declNode) => {
          ruleDescriptor.rules[declNode.prop] = replaceVariables(declNode, declNode.value, variables);
        });

        descriptor.rules.push(ruleDescriptor);
      });
    }
    else if (node.type === 'decl' && definedVarRegex.test(node.prop)) {
      variables[node.prop] = replaceVariables(node, node.value, variables);
      return;
    }
    else {
      return;
    }

    descriptor.selector = descriptor.selector.replace(/\n/g, ' ');
    descriptors.push(descriptor);
  });

  return { descriptors, variables };
}

