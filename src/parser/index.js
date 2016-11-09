import Input from 'postcss/lib/input';
import FocssParser from './focss-parser';

export default function parse(styles, opts) {
  const input = new Input(styles, opts);
  const parser = new FocssParser(input);

  parser.tokenize();
  parser.loop();

  return parser.root;
}
