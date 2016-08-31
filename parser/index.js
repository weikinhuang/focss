import postcss from 'postcss';
import parse from './parse';

const plugin = postcss.plugin('behance-postcss-focss', () => {
  return (root, result) => {
    const descriptors = [];

    root.each((node) => {
      const descriptor = {
        rules: {}
      };

      if (node.type === 'rule') {
        descriptor.selector = node.selector;

        node.walkDecls(({ prop, value }) => {
          descriptor.rules[prop] = value;
        });
      }
      else if (node.type === 'atrule' && node.name === 'media') {
        descriptor.selector = `@${node.name} ${node.params}`;

        node.walkRules((ruleNode) => {
          const rules = {};

          ruleNode.walkDecls(({ prop, value }) => {
            rules[prop] = value;
          });

          descriptor.rules[ruleNode.selector] = rules;
        });
      }
      else {
        return;
      }

      descriptors.push(descriptor);
    });

    result.focssDescriptors = descriptors;
  };
});


/**
 * Parse Focss descriptors
 * @param {string} styles Styles from a .focss file.
 * @returns {Promise<Object>} Object containing parsed Focss Descriptors.
 */
export default function parseFocssDescriptors(styles) {
  return postcss([plugin]).process(styles, { parser: parse });
}
