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
      this._fox.insert('%forEach(foo, .bar[data-id="%id%"])', {
        'max-width': 'width'
      });

      expect(this._fox.toString({
        foo: [
          { id: 3, width: 100 },
          { id: 4, width: 200 }
        ]
      })).toEqual('.bar[data-id="3"]{max-width:100px;}.bar[data-id="4"]{max-width:200px;}');
    });

    it('when inserted rule contains %filterEach selector', function() {
      this._fox.insert('%filterEach(foo, true, .bar[data-id="%id%"])', {
        'max-width': 'width'
      });

      expect(this._fox.toString({
        foo: [
          { id: 3, width: 100 },
          { id: 4, width: 200 }
        ]
      })).toEqual('.bar[data-id="3"]{max-width:100px;}.bar[data-id="4"]{max-width:200px;}');
    });
  });
});
