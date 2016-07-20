// Scoped style support detection
// @see https://github.com/PM5544/scoped-polyfill
export default (function() {
  var check = document.createElement('style'),
      DOMStyle = 'undefined' !== typeof check.sheet ? 'sheet' : 'undefined' !== typeof check.getSheet ? 'getSheet' : 'styleSheet',
      scopeSupported = 'scoped' in check,
      testSheet, DOMRules, testStyle;

  // we need to append it to the DOM because the DOM element at least FF keeps NULL as a sheet utill appended
  // and we can't check for the rules / cssRules and changeSelectorText untill we have that
  document.body.appendChild(check);
  testSheet = check[DOMStyle];

  // add a test styleRule to be able to test selectorText changing support
  // IE doesn't allow inserting of '' as a styleRule
  if (testSheet.addRule) {
    testSheet.addRule('c', 'blink');
  }
  else {
    testSheet.insertRule('c{}', 0);
  }

  // store the way to get to the list of rules
  DOMRules = testSheet.rules ? 'rules' : 'cssRules';

  // cache the test rule (its allways the first since we didn't add any other thing inside this <style>
  testStyle = testSheet[DOMRules][0];

  // try catch it to prevent IE from throwing errors
  // can't check the read-only flag since IE just throws errors when setting it and Firefox won't allow setting it (and has no read-only flag
  try {
    testStyle.selectorText = 'd';
  }
  catch (e) { }

  // Edge will report that it supports the scoped attribute, but it doesn't support the scope selector.
  // Try inserting a :scope rule into the sheet to see if it is supported
  try {
    testSheet.insertRule(':scope {}', 1);
  }
  catch (missingScope) {
    scopeSupported = false;
  }

  // check if the selectorText has changed to the value we tried to set it to
  // toLowerCase() it to account for browsers who change the text
  var changeSelectorTextAllowed = 'd' === testStyle.selectorText.toLowerCase();

  // remove the <style> to clean up
  check.parentNode.removeChild(check);

  // return the object with the appropriate flags
  return {
    scopeSupported: scopeSupported,
    rules: DOMRules,
    sheet: DOMStyle,
    changeSelectorTextAllowed: changeSelectorTextAllowed
  };
}());
