import postcss from 'postcss';
import transform from './transform';

export default postcss.plugin('behance-postcss-focss-transform', (opts = {}) => {
  return function(root, result) {
    result.focss = transform(root, opts.variables);
  };
});
