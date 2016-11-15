import postcss from 'postcss';
import transform from './transform';

export default postcss.plugin('behance-postcss-focss-transform', () => {
  return function(root, result) {
    result.focssDescriptors = transform(root);
  };
});
