define(['jsep'], function(jsep) {
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
      symbols: symbols,
      body: body
    };
  }

  var Compiler = {
    compile: function(spec) {
      var base = '$', pluginbase = '$$',
      artifacts = {},
      body = Object.keys(spec)
      .map(function(property) {
        var expr = spec[property], unit;
        if (typeof expr !== 'string') {
          unit = expr.unit;
          expr = expr.value;
        }

        var inner = this.parse(expr, base, pluginbase);
        inner.symbols.forEach(function(symbol) {
          symbol = symbol.join('.');
          artifacts[symbol] = (artifacts[symbol] | 0) + 1;
        });

        if (unit) {
          inner.body += '+ "' + unit + '"';
        }

        return '_["'+ property +'"]' + '=' + inner.body;
      }, this)
      .join(';');

      body = 'var _={};' + body + ';return _;';

      var result = new Function(base, pluginbase, body);
      result.artifacts = Object.keys(artifacts);
      return result;
    },
    parse: treeParse
  };

  return Compiler;
});
