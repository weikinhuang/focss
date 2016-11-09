export function replaceVariables(node, value, variables) {
  const usedVarRegex = /(\$[\w\d-]+)/ig;

  return value.replace(usedVarRegex, (match) => {
    if (!variables[match]) {
      const { source: { start: { line, column } } } = node;
      throw new Error(`Variable ${value} is not defined. (${line}:${column})`);
    }

    return variables[match];
  });
}

