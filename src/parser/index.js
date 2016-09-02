import postcss from 'postcss';
import parse from './parse';

const plugin = postcss.plugin('behance-postcss-focss', () => {
  return (root, result) => {
    const descriptors = [];

    root.each((node) => {
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
