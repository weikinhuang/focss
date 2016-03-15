define(['jsep', 'nbd/util/extend'], function(jsep, extend) {
  'use strict';

  /**
   * AST tree parse/compilation
   */
  function treeParse(expr, scope, callPrefix) {
    callPrefix = callPrefix || '';
    var base = scope;
    var tree = jsep(expr);

    var symbol, symbols = [];

    // Performs DFS walk of tree
    var body, current, stack = [{ node: tree }];

    while (current = stack[0]) {
      // cases from jsep
      switch(current.node.type) {
        // leaf types
        case 'Identifier':
          body = base ? base + '["'+current.node.name+'"]' : current.node.name;
          symbol = null;
          if (base !== null) {
            symbols.push(symbol = [current.node.name]);
          }
          stack.shift();
          break;
        case 'Literal':
          body = current.node.raw;
          stack.shift();
          break;
        case 'ThisExpression':
          body = 'this';
          stack.shift();
          break;
        // branch types
        case 'MemberExpression':
          if (current.left === undefined) {
            current.left = true;
            stack.unshift({ node: current.node.object });
            break;
          }
          else if (current.right === undefined) {
            current.left = body;
            current.right = true;
            if (current.node.computed) {
              stack.unshift({ node: current.node.property });
              body = current.node.property.value;
              if (symbol) {
                symbol.push(current.node.property.value);
              }
              break;
            }
            if (symbol) {
              symbol.push(current.node.property.name || current.node.property.value);
            }
            body = current.node.property.name !== undefined ?
              '"'+current.node.property.name+'"' :
              current.node.property.value;
          }
          body = current.left+'['+body+']';
          stack.shift();
          break;
        case 'UnaryExpression':
          if (!current.visited) {
            current.visited = true;
            stack.unshift({ node: current.node.argument });
            break;
          }
          body = current.node.operator + '('+body+')';
          stack.shift();
          break;
        case 'BinaryExpression':
        case 'LogicalExpression':
          if (current.left === undefined) {
            current.left = true;
            stack.unshift({ node: current.node.left });
            break;
          }
          else if (current.right === undefined) {
            current.left = body;
            current.right = true;
            stack.unshift({ node: current.node.right });
            break;
          }
          body = '('+current.left + current.node.operator + body+')';
          stack.shift();
          break;
        case 'ConditionalExpression':
          if (current.test === undefined) {
            current.test = true;
            stack.unshift({ node: current.node.test });
            break;
          }
          else if (current.consequent === undefined) {
            current.test = body;
            current.consequent = true;
            stack.unshift({ node: current.node.consequent });
            break;
          }
          else if (current.alternate === undefined) {
            current.consequent = body;
            current.alternate = true;
            stack.unshift({ node: current.node.alternate });
            break;
          }
          body = '('+current.test + '?' + current.consequent + ':' + body+')';
          stack.shift();
          break;
        case 'ArrayExpression':
          if (current.body === undefined) {
            current.body = '';
          }
          else {
            current.body += body;
            if (current.node.elements.length) {
              current.body += ',';
            }
          }
          if (current.node.elements.length) {
            stack.unshift({ node: current.node.elements.shift() });
            break;
          }
          if (current.node.isArgs) {
            body = current.body;
          }
          else {
            body = '([' + current.body + '])';
          }
          stack.shift();
          break;
        case 'CallExpression':
          if (current.callee === undefined) {
            current.callee = true;
            stack.unshift({ node: current.node.callee });
            base = null;
            break;
          }
          else if (current.arguments === undefined) {
            current.callee = body;
            base = scope;
            current.arguments = true;
            stack.unshift({
              node: {
                type: 'ArrayExpression',
                isArgs: true,
                elements: current.node.arguments
              }
           });
           break;
          }
          current.arguments = body;
          body = '(function() {try {return ' +
            (callPrefix ? callPrefix + '.' + current.callee : current.callee) +
            '('+current.arguments+');} ' +
            'catch(e) {return \'' + current.callee +
            '(\'+['+current.arguments+'].join()+\')\';}})()';
          stack.shift();
          break;
        default:
          stack.shift();
          break;
      }
    }

    return {
      artifacts: symbols.reduce(function(obj, symbol) {
        obj[symbol.join('.')] = true;
        return obj;
      }, {}),
      body: body
    };
  }

  var base = '$', callbase = '$$';
  return {
    compile: function(expr) {
      if (this._cache[expr] && this._cache[expr].fn) {
        return this._cache[expr].fn;
      }
      var res = this.parse(expr),
      fn = new Function(base, callbase, 'return ' + res.body);
      fn.artifacts = res.artifacts;
      return (this._cache[expr].fn = fn);
    },
    compileSpec: function(spec, arrayMemberExpr) {
      var artifacts = {},
      body = Object.keys(spec)
      .map(function(property) {
        var expr = spec[property], unit;
        if (typeof expr !== 'string') {
          unit = expr.unit;
          expr = expr.value;
        }

        var inner = this.parse(expr);
        extend(artifacts, inner.artifacts);

        var body = inner.body;
        if (arrayMemberExpr) {
          body = body.replace(/\$/g, '$.' + arrayMemberExpr);
        }

        return '_["'+ property +'"]' + '=' + body + (unit ? '+"' + unit + '"' : '');
      }, this)
      .join(';');

      body = 'var _={};' + body + ';return _;';

      var result = new Function(base, callbase, body);
      result.artifacts = artifacts;
      return result;
    },
    parse: function parse(expr) {
      if (this._cache[expr]) {
        return this._cache[expr];
      }

      return (this._cache[expr] = treeParse(expr, base, callbase));
    },
    _cache: {}
  };
});
