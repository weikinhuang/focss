import Focss from '../..';

describe('toString', function() {
  beforeEach(function() {
    this._fox = new Focss();
  });

  afterEach(function() {
    this._fox.destroy();
    this._fox = null;
  });

  describe('returns a string of processed styles', function() {
    it('when inserted rule contains single selector', function() {
      this._fox.insert('.foo', {
        'max-width': 'width'
      });

      expect(this._fox.toString({ width: 100 })).toEqual('.foo{max-width:100px;}');
    });

    it('when inserted rule contains %forEach selector', function() {
      this._fox.insert({
        '.baz': {
          width: 'width'
        },
        '%forEach(foo, .bar[data-id="%id%"])': {
          'max-width': 'maxWidth'
        }
      });

      expect(this._fox.toString({
        width: 400,
        foo: [
          { id: 3, maxWidth: 100 },
          { id: 4, maxWidth: 200 }
        ]
      })).toEqual('.baz{width:400px;}.bar[data-id="3"]{max-width:100px;}.bar[data-id="4"]{max-width:200px;}');
    });

    it('when inserted rule contains %filterEach selector', function() {
      this._fox.insert({
        '.baz': {
          width: 'width'
        },
        '%filterEach(foo, true, .bar[data-id="%id%"])': {
          'max-width': 'width'
        }
      });

      expect(this._fox.toString({
        width: 400,
        foo: [
          { id: 3, width: 100 },
          { id: 4, width: 200 }
        ]
      })).toEqual('.baz{width:400px;}.bar[data-id="3"]{max-width:100px;}.bar[data-id="4"]{max-width:200px;}');
    });

    it('when inserted rule contains media query', function() {
      this._fox.insert({
        '@media screen and (max-width: 300px)': {
          '.class1': {
            width: 'foo',
            color: 'bar'
          }
        }
      });

      expect(this._fox.toString({
        foo: 100,
        bar: 'red'
      })).toEqual('@media screen and (max-width: 300px){.class1{width:100px;color:red;}}');
    });

    it('when inserted media query contains %forEach selector', function() {
      this._fox.insert({
        '@media screen and (max-width: 300px)': {
          '.class1': {
            width: 'foo',
            color: 'bar'
          },
          '%forEach(baz, .class2[data-id="%id%"])': {
            'max-width': 'qux'
          }
        }
      });

      expect(this._fox.toString({
        foo: 100,
        bar: 'red',
        baz: [
          { id: 3, qux: 1200 },
          { id: 4, qux: 800 }
        ]
      })).toEqual('@media screen and (max-width: 300px){.class1{width:100px;color:red;}.class2[data-id="3"]{max-width:1200px;}.class2[data-id="4"]{max-width:800px;}}');
    });

    it('when inserted media query contains %filterEach selector', function() {
      this._fox.insert({
        '@media screen and (max-width: 300px)': {
          '.class1': {
            width: 'foo',
            color: 'bar'
          },
          '%filterEach(baz, qux < 1000, .class2[data-id="%id%"])': {
            'max-width': 'qux'
          }
        }
      });

      expect(this._fox.toString({
        foo: 100,
        bar: 'red',
        baz: [
          { id: 3, qux: 1200 },
          { id: 4, qux: 800 }
        ]
      })).toEqual('@media screen and (max-width: 300px){.class1{width:100px;color:red;}.class2[data-id="4"]{max-width:800px;}}');
    });

    it('when inserted rule list contains multiple media queries', function() {
      this._fox.insert({
        '@media screen and (max-width: 300px)': {
          '.class1': {
            width: 'foo',
          }
        }
      });
      this._fox.insert({
        '@media screen and (max-width: 600px)': {
          '.class1': {
            color: 'bar'
          }
        }
      });

      expect(this._fox.toString({
        foo: 100,
        bar: 'red'
      })).toEqual('@media screen and (max-width: 300px){.class1{width:100px;}}@media screen and (max-width: 600px){.class1{color:red;}}');
    });

    it('when inserted rule list contains a mixture of non-media query and media query rules', function() {
      this._fox.insert({
        '.class1': {
          'max-width': 'foo'
        },
        '@media screen and (max-width: 300px)': {
          '.class1': {
            width: 'foo',
            color: 'bar'
          }
        }
      });

      expect(this._fox.toString({
        foo: 100,
        bar: 'red'
      })).toEqual('.class1{max-width:100px;}@media screen and (max-width: 300px){.class1{width:100px;color:red;}}');
    });


    it('when inserted rule uses variables', function() {
      this._fox.insertVars({
        class: 'foo',
        bar: 'red'
      });

      this._fox.insert('.${__var.class}', {
        'max-width': 'width',
        color: '__var.bar'
      });

      expect(this._fox.toString({ width: 100 })).toEqual('.foo{max-width:100px;color:red;}');
    });
  });

  it('returns media queries in order in which they were inserted', function() {
    this._fox.insert({
      '@media screen and (max-width: 300px)': {
        '.class1': {
          width: 'foo',
        }
      }
    });
    this._fox.insert({
      '@media screen and (max-width: 600px)': {
        '.class1': {
          color: 'bar'
        }
      }
    });
    this._fox.insert({
      '@media screen and (max-width: 100px)': {
        '.class1': {
          height: 'baz'
        }
      }
    });

    expect(this._fox.toString({
      foo: 100,
      bar: 'red',
      baz: 600
    })).toEqual('@media screen and (max-width: 300px){.class1{width:100px;}}@media screen and (max-width: 600px){.class1{color:red;}}@media screen and (max-width: 100px){.class1{height:600px;}}');
  });

  it('returns non-media query rules before media query rules regardless of order inserted', function() {
    this._fox.insert({
      '.class1': {
        color: 'bar'
      }
    });

    this._fox.insert({
      '@media screen and (max-width: 300px)': {
        '.class1': {
          width: 'foo',
          color: 'bar'
        },
        '%forEach(baz, .class2[data-id="%id%"])': {
          'max-width': 'qux'
        }
      }
    });

    this._fox.insert({
      '.class2': {
        'max-width': 'foo'
      }
    });

    expect(this._fox.toString({
      foo: 100,
      bar: 'red',
      baz: [
        { id: 3, qux: 1200 },
        { id: 4, qux: 800 }
      ]
    })).toEqual('.class1{color:red;}.class2{max-width:100px;}@media screen and (max-width: 300px){.class1{width:100px;color:red;}.class2[data-id="3"]{max-width:1200px;}.class2[data-id="4"]{max-width:800px;}}');
  });
});
