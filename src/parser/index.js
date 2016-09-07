import postcss from 'postcss';
import parser from './parse';

function transform(ast) {
  const descriptors = [];

  ast.each((node) => {
    const descriptor = {};

    if (node.type === 'rule') {
      descriptor.selector = node.selector;
      descriptor.rules = {};

      node.walkDecls(({ prop, value }) => {
        descriptor.rules[prop] = value;
      });
    }
    else if (node.type === 'atrule' && node.name === 'media') {
      descriptor.selector = `@${node.name} ${node.params}`;
      descriptor.rules = [];

      node.walkRules((ruleNode) => {
        const ruleDescriptor = {
          selector: ruleNode.selector.replace(/\n/g, ' '),
          rules: {}
        };

        ruleNode.walkDecls(({ prop, value }) => {
          ruleDescriptor.rules[prop] = value;
        });

        descriptor.rules.push(ruleDescriptor);
      });
    }
    else {
      return;
    }

    descriptor.selector = descriptor.selector.replace(/\n/g, ' ');
    descriptors.push(descriptor);
  });

  return descriptors;
}

const plugin = postcss.plugin('behance-postcss-focss', () => {
  return (root, result) => {
    result.focssDescriptors = transform(root);
  };
});

/**
 * Parse Focss descriptors
 * @param {string} styles Styles from a .focss file.
 * @returns {Promise<Object>} Object containing parsed Focss Descriptors.
 */
export function parse(styles) {
  return postcss([plugin]).process(styles, { parser });
}

/**
 * Parse Focss descriptors synchronously
 * @param {string} styles Styles from a .focss file.
 * @returns {Object} Object containing parsed Focss Descriptors.
 */
export function parseSync(styles) {
  const ast = parser(styles);
  return transform(ast);
}
