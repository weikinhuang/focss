import postcss from 'postcss';
import parser from './parse';

function replaceVariables(node, value, variables) {
  const usedVarRegex = /(\$[\w\d-]+)/ig;
  return value.replace(usedVarRegex, (match) => {
    if (!variables[match]) {
      const { source: { start: { line, column } } } = node;
      throw new Error(`Variable ${value} is not defined. (${line}:${column})`);
    }

    return variables[match];
  });
}

function transform(ast, variables = {}) {
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
          rules: {}
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

const plugin = postcss.plugin('behance-postcss-focss', () => {
  return (root, result) => {
    return result.focss = transform(root, result.opts.variables);
  };
});

/**
 * Parse Focss descriptors
 * @param {string} styles Styles from a .focss file.
 * @returns {Promise<Object>} Object containing parsed Focss Descriptors.
 */
export function parse(styles, variables) {
  return postcss([plugin]).process(styles, { parser, variables });
}

/**
 * Parse Focss descriptors synchronously
 * @param {string} styles Styles from a .focss file.
 * @returns {Object} Object containing parsed Focss Descriptors.
 */
export function parseSync(styles, variables) {
  const ast = parser(styles);
  return transform(ast, variables);
}
