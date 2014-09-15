define(['jsep'], function(jsep) {
  'use strict';

  /**
   * AST tree parse/compilation
   */
  function treeCompile(expr, scope) {
    scope = scope || '';
    var tree = jsep(expr);

    // Performs DFS walk of tree
    var body, current, stack = [{ node: tree }];

    while (current = stack[0]) {
      // cases from jsep
      switch(current.node.type) {
        // leaf types
        case 'Identifier':
          body = scope + '["'+current.node.name+'"]';
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
            body = '"'+current.node.property.name+'"';
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
        default:
          stack.shift();
          break;
      }
    }

    return body;
  }

  var Compiler = {
    compile: treeCompile,
    parse: function(spec) {
      var base = 'input',
      body = Object.keys(spec)
      .map(function(property) {
        var expr = spec[property], unit;
        if (typeof expr !== 'string') {
          unit = expr.unit;
          expr = expr.value;
        }

        var inner = this.compile(expr, base);
        if (unit) {
          inner += '+ "' + unit + '"';
        }

        return '_["'+ property +'"]' + '=' + inner;
      }, this)
      .join(';');

      body = 'var _={};' + body + ';return _;';

      return new Function(base, body);
    }
  };

  return Compiler;
});
