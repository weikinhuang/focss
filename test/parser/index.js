/* eslint-env node */

import path from 'path';
import fs from 'fs';
import parse from '../../src/parser';
import Focss from '../../src';

describe('parser', function() {
  it('returns an array of parsed Focss descriptors', function(done) {
    const styles = `.foo {
                      max-width: bar;
                    }
                    .baz {
                      width: qux;
                    }`;

    parse(styles)
    .then(({ focssDescriptors }) => {
      expect(Array.isArray(focssDescriptors)).toBeTruthy();
      expect(focssDescriptors.length).toEqual(2);
      done();
    }).catch((e) => {
      done.fail(e);
    });
  });

  it('retains the original order of the file contents', function(done) {
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

    parse(styles)
    .then(({ focssDescriptors }) => {
      expect(focssDescriptors).toEqual([
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
        },
      ]);
      done();
    }).catch((e) => {
      done.fail(e);
    });
  });

  it('retains the order of the file contents', function(done) {
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

    parse(styles)
    .then(({ focssDescriptors }) => {
      expect(focssDescriptors).toEqual([
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
      ]);
      done();
    }).catch((e) => {
      done.fail(e);
    });
  });

  describe('correctly parses', function() {
    it('rule declarations', function(done) {
      const styles = `.foo {
                        max-width: bar;
                      }`;

      parse(styles)
      .then(({ focssDescriptors }) => {
        expect(focssDescriptors).toEqual([
          {
            selector: '.foo',
            rules: {
              'max-width': 'bar'
            }
          }
        ]);
        done();
      }).catch((e) => {
        done.fail(e);
      });
    });

    it('media queries', function(done) {
      const styles = `@media screen and (max-width: 1000px) {
                        .foo {
                          max-width: bar;
                        }
                      }`;

      parse(styles)
      .then(({ focssDescriptors }) => {
        expect(focssDescriptors).toEqual([
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
        ]);
        done();
      }).catch((e) => {
        done.fail(e);
      });
    });

    it('computed selectors', function(done) {
      const styles = `.<% foo %>1 {
                        max-width: bar;
                      }`;

      parse(styles)
      .then(({ focssDescriptors }) => {
        expect(focssDescriptors).toEqual([
          {
            selector: '.<% foo %>1',
            rules: {
              'max-width': 'bar'
            }
          }
        ]);
        done();
      }).catch((e) => {
        done.fail(e);
      });
    });

    it('%forEach selectors', function(done) {
      const styles = `%forEach(foo, .bar[data-id="%id%"]) {
                        max-width: bar;
                      }`;

      parse(styles)
      .then(({ focssDescriptors }) => {
        expect(focssDescriptors).toEqual([
          {
            selector: '%forEach(foo, .bar[data-id="%id%"])',
            rules: {
              'max-width': 'bar'
            }
          }
        ]);
        done();
      }).catch((e) => {
        done.fail(e);
      });
    });

    it('%filterEach selectors', function(done) {
      const styles = `%filterEach(foo, true, .bar[data-id="%id%"]) {
                        max-width: bar;
                      }`;

      parse(styles)
      .then(({ focssDescriptors }) => {
        expect(focssDescriptors).toEqual([
          {
            selector: '%filterEach(foo, true, .bar[data-id="%id%"])',
            rules: {
              'max-width': 'bar'
            }
          }
        ]);
        done();
      }).catch((e) => {
        done.fail(e);
      });
    });

    it('parses JS ternary expressions', function(done) {
      const styles = `.foo {
                        max-width: a === "bar" ? c : null;
                      }`;

      parse(styles)
      .then(({ focssDescriptors }) => {
        expect(focssDescriptors).toEqual([
          {
            selector: '.foo',
            rules: {
              'max-width': 'a === "bar" ? c : null'
            }
          }
        ]);
        done();
      }).catch((e) => {
        done.fail(e);
      });
    });
  });

  it('calling toString() with parsed descriptors and data should return processed styles', function(done) {
    const styles = fs.readFileSync(path.resolve(__dirname, 'fixtures', 'styles.focss'), { encoding: 'utf8' });

    parse(styles)
    .then(({ focssDescriptors }) => {
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
      expect(fox.toString(data)).toEqual('.foo{width:200px;}.foo:hover{max-width:800%;}nav .foo a.active, nav .foo a.__fake{margin-left:200px;}.foo 3{opacity:1;}.class1[data-id="3"]{float:none;margin-top:18px;width:18px;}.class1[data-id="4"]{float:left;margin-top:8px;width:8px;}.class2[data-id="1"]{max-width:400px;}.class2[data-id="2"]{max-width:600px;}@media screen and (max-width: 300px){.foo{width:200px;}.foo:hover{max-width:800%;}nav .foo a.active, nav .foo a.__fake{margin-left:200px;}.foo 3{opacity:1;}.class1[data-id="3"]{float:none;margin-top:18px;width:18px;}.class1[data-id="4"]{float:left;margin-top:8px;width:8px;}.class2[data-id="1"]{max-width:400px;}.class2[data-id="2"]{max-width:600px;}}');
      done();
    }).catch((e) => {
      done.fail(e);
    });
  });
});
