import parse from '../../../parser';

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
    }).catch(() => {
      done.fail();
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
          rules: {
            '.foo': {
              'max-width': 'a === b ? c : ""'
            }
          }
        }
      ]);
      done();
    }).catch(() => {
      done.fail();
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
          rules: {
            '.foo': {
              'max-width': 'a + b'
            }
          }
        },
        {
          selector: '.baz',
          rules: {
            width: 'qux'
          }
        }
      ]);
      done();
    }).catch(() => {
      done.fail();
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
      }).catch(() => {
        done.fail();
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
            rules: {
              '.foo': {
                'max-width': 'bar'
              }
            }
          }
        ]);
        done();
      }).catch(() => {
        done.fail();
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
      }).catch(() => {
        done.fail();
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
      }).catch(() => {
        done.fail();
      });
    });
  });
});
