/* eslint-env node */

import path from 'path';
import fs from 'fs';
import { parse, parseSync } from '../../src/parser';
import Focss from '../../src';

describe('parser', function() {
  describe('should return an array of parsed Focss descriptors', function() {
    function checkDescriptors(parsedDescriptors) {
      expect(Array.isArray(parsedDescriptors)).toBeTruthy();
      expect(parsedDescriptors.length).toEqual(2);
    }

    const styles = `.foo {
                      max-width: bar;
                    }
                    .baz {
                      width: qux;
                    }`;

    it('when parsed with parse', function(done) {
      parse(styles)
      .then(({ focssDescriptors }) => {
        checkDescriptors(focssDescriptors);
      })
      .then(done, done.fail);
    });

    it('when parsed with parseSync', function() {
      const focssDescriptors = parseSync(styles);
      checkDescriptors(focssDescriptors);
    });
  });

  describe('should retain the original order of the file contents', function() {
    const styles = `.foo {
                      max-width: bar;
                    }
                    .baz {
                      width: qux;
                    }
                    @media screen and (max-width: 300px) {
                      .foo {
                        max-width: a === b ? c : "";
                      }
                    }`;
    const result = [
      {
        selector: '.foo',
        rules: {
          'max-width': 'bar'
        }
      },
      {
        selector: '.baz',
        rules: {
          width: 'qux'
        }
      },
      {
        selector: '@media screen and (max-width: 300px)',
        rules: [
          {
            selector: '.foo',
            rules: {
              'max-width': 'a === b ? c : ""'
            }
          }
        ]
      }
    ];

    it('when parsed with parse', function(done) {
      parse(styles)
      .then(({ focssDescriptors }) => {
        expect(focssDescriptors).toEqual(result);
      })
      .then(done, done.fail);
    });

    it('when parsed with parseSync', function() {
      const focssDescriptors = parseSync(styles);
      expect(focssDescriptors).toEqual(result);
    });
  });

  describe('should retain the original order of the file contents when reordered', function() {
    const styles = `.foo {
                      max-width: bar;
                    }
                    @media screen and (max-width: 300px) {
                      .foo {
                        max-width: a + b;
                      }
                    }
                    .baz {
                      width: qux;
                    }`;
    const result = [
      {
        selector: '.foo',
        rules: {
          'max-width': 'bar'
        }
      },
      {
        selector: '@media screen and (max-width: 300px)',
        rules: [
          {
            selector: '.foo',
            rules: {
              'max-width': 'a + b'
            }
          }
        ]
      },
      {
        selector: '.baz',
        rules: {
          width: 'qux'
        }
      }
    ];

    it('when parsed with parse', function(done) {
      parse(styles)
      .then(({ focssDescriptors }) => {
        expect(focssDescriptors).toEqual(result);
      })
      .then(done, done.fail);
    });

    it('when parsed with parseSync', function() {
      const focssDescriptors = parseSync(styles);
      expect(focssDescriptors).toEqual(result);
    });
  });

  describe('should return Focss descriptors containing', function() {
    describe('rule declarations', function() {
      const styles = `.foo {
                        max-width: bar;
                      }`;
      const result = [
        {
          selector: '.foo',
          rules: {
            'max-width': 'bar'
          }
        }
      ];

      it('when parsed with parse', function(done) {
        parse(styles)
        .then(({ focssDescriptors }) => {
          expect(focssDescriptors).toEqual(result);
        })
        .then(done, done.fail);
      });

      it('when parsed with parseSync', function() {
        const focssDescriptors = parseSync(styles);
        expect(focssDescriptors).toEqual(result);
      });
    });

    describe('media queries', function() {
      const styles = `@media screen and (max-width: 1000px) {
                        .foo {
                          max-width: bar;
                        }
                      }`;
      const result = [
        {
          selector: '@media screen and (max-width: 1000px)',
          rules: [
            {
              selector: '.foo',
              rules: {
                'max-width': 'bar'
              }
            }
          ]
        }
      ];

      it('when parsed with parse', function(done) {
        parse(styles)
        .then(({ focssDescriptors }) => {
          expect(focssDescriptors).toEqual(result);
        })
        .then(done, done.fail);
      });

      it('when parsed with parseSync', function() {
        const focssDescriptors = parseSync(styles);
        expect(focssDescriptors).toEqual(result);
      });
    });

    describe('computed selectors', function() {
      const styles = `.<% foo %>1 {
                        max-width: bar;
                      }`;
      const result = [
        {
          selector: '.<% foo %>1',
          rules: {
            'max-width': 'bar'
          }
        }
      ];

      it('when parsed with parse', function(done) {
        parse(styles)
        .then(({ focssDescriptors }) => {
          expect(focssDescriptors).toEqual(result);
        })
        .then(done, done.fail);
      });

      it('when parsed with parseSync', function() {
        const focssDescriptors = parseSync(styles);
        expect(focssDescriptors).toEqual(result);
      });
    });

    describe('%forEach selectors', function() {
      const styles = `%forEach(foo, .bar[data-id="%id%"]) {
                        max-width: bar;
                      }`;
      const result = [
        {
          selector: '%forEach(foo, .bar[data-id="%id%"])',
          rules: {
            'max-width': 'bar'
          }
        }
      ];

      it('when parsed with parse', function(done) {
        parse(styles)
        .then(({ focssDescriptors }) => {
          expect(focssDescriptors).toEqual(result);
        })
        .then(done, done.fail);
      });

      it('when parsed with parseSync', function() {
        const focssDescriptors = parseSync(styles);
        expect(focssDescriptors).toEqual(result);
      });
    });

    describe('%filterEach selectors', function() {
      const styles = `%filterEach(foo, true, .bar[data-id="%id%"]) {
                        max-width: bar;
                      }`;
      const result = [
        {
          selector: '%filterEach(foo, true, .bar[data-id="%id%"])',
          rules: {
            'max-width': 'bar'
          }
        }
      ];

      it('when parsed with parse', function(done) {
        parse(styles)
        .then(({ focssDescriptors }) => {
          expect(focssDescriptors).toEqual(result);
        })
        .then(done, done.fail);
      });

      it('when parsed with parseSync', function() {
        const focssDescriptors = parseSync(styles);
        expect(focssDescriptors).toEqual(result);
      });
    });

    describe('JS ternary expressions', function() {
      const styles = `.foo {
                        max-width: a === "bar" ? c : null;
                      }`;
      const result = [
        {
          selector: '.foo',
          rules: {
            'max-width': 'a === "bar" ? c : null'
          }
        }
      ];

      it('when parsed with parse', function(done) {
        parse(styles)
        .then(({ focssDescriptors }) => {
          expect(focssDescriptors).toEqual(result);
        })
        .then(done, done.fail);
      });

      it('when parsed with parseSync', function() {
        const focssDescriptors = parseSync(styles);
        expect(focssDescriptors).toEqual(result);
      });
    });

    describe('calling toString() should return processed styles', function() {
      function processAndValidate(focssDescriptors, result) {
        const fox = new Focss();
        const data = {
          width1: 200,
          width2: 600,
          num1: 3,
          num2: 5,
          opacity: .6,
          foo: [
            { id: 1, num1: 1, num2: 4, num3: 2, float: 'left' },
            { id: 2, num1: 2, num2: 3, num3: 3, float: 'right' },
            { id: 3, num1: 3, num2: 6, num3: 4, float: 'none' },
            { id: 4, num1: 4, num2: 2, num3: 1, float: 'left' }
          ],
          baz: [
            { id: 1, width: 400 },
            { id: 2, width: 600 }
          ]
        };

        fox.insert(focssDescriptors);
        expect(fox.toString(data)).toEqual(result);
      }

      const styles = fs.readFileSync(path.resolve(__dirname, 'fixtures', 'styles.focss'), { encoding: 'utf8' });
      const result = '.foo{width:200px;}.foo:hover{max-width:800%;}nav .foo a.active, nav .foo a.__fake{margin-left:200px;}.foo 3{opacity:1;}.class1[data-id="3"]{float:none;margin-top:18px;width:18px;}.class1[data-id="4"]{float:left;margin-top:8px;width:8px;}.class2[data-id="1"]{max-width:400px;}.class2[data-id="2"]{max-width:600px;}@media screen and (max-width: 300px){.foo{width:200px;}.foo:hover{max-width:800%;}nav .foo a.active, nav .foo a.__fake{margin-left:200px;}.foo 3{opacity:1;}.class1[data-id="3"]{float:none;margin-top:18px;width:18px;}.class1[data-id="4"]{float:left;margin-top:8px;width:8px;}.class2[data-id="1"]{max-width:400px;}.class2[data-id="2"]{max-width:600px;}}';

      it('when inserted descriptors are parsed with parse', function(done) {
        parse(styles)
        .then(({ focssDescriptors }) => {
          processAndValidate(focssDescriptors, result);
        })
        .then(done, done.fail);
      });

      it('when inserted descriptors are parsed with parseSync', function() {
        const focssDescriptors = parseSync(styles);
        processAndValidate(focssDescriptors, result);
      });
    });
  });
});
