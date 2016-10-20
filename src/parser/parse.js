import Parser from 'postcss/lib/parser';
import Input from 'postcss/lib/input';

class FocssParser extends Parser {
  // Override method that throws when multiple colons are found
  // before a semicolon to allow for JS ternary expressions.
  checkMissedSemicolon() {}

  // This is a hook for the safe PostCSS parser (not used by
  // the standard parser) that we can leverage to check
  // rule declarations for missing semicolons.
  precheckMissedSemicolon(tokens) {
    for (let i = tokens.length - 1; i > 0; i--) {
      const token = tokens[i];
      if (i > 0 && token[0] === 'space' && token[1].includes('\n')) {
        const prevToken = tokens[i - 1];
        if (prevToken[0] !== ';') {
          throw this.input.error('Missed semicolon', prevToken[2], prevToken[3]);
        }
      }
    }
  }
}

export default function parser(styles, opts) {
  const input = new Input(styles, opts);
  const parser = new FocssParser(input);

  parser.tokenize();
  parser.loop();

  return parser.root;
}
