import Parser from 'postcss/lib/parser';
import Input from 'postcss/lib/input';

class FocssParser extends Parser {
  // Override method that throws when multiple colons are found
  // before a semicolon to allow for JS ternary expressions.
  checkMissedSemicolon() {}
}

export default function parse(styles, opts) {
  const input = new Input(styles, opts);
  const parser = new FocssParser(input);

  parser.tokenize();
  parser.loop();

  return parser.root;
}
