const transformKeyAlias = new Map([
  ['x', 'translateX'],
  ['y', 'translateY']
]);
const axes = ["", "X", "Y", "Z"];
const order = ['perspective', 'translate', 'rotate', 'skew', 'scale'];
const transformProps = [];
order.forEach((key) => {
  axes.forEach((axis) => {
    transformProps.push(`${key}${axis}`)
  });
});

export function sortTransformProps(a, b) {
  return transformProps.indexOf(a) - transformProps.indexOf(b);
}

// TODO: unit conversion needs to happen in a more generic way
const keyToUnit = new Map([
  ['x', 'px'],
  ['y', 'px'],
  ['rotate', 'deg'],
  ['rotateX', 'deg'],
  ['rotateY', 'deg'],
  ['skewX', 'deg'],
  ['skewY', 'deg']
]);

export function serializeValuesAsTransform(transformProperties) {
  const sortedTransformKeys = Object.keys(transformProperties).sort(sortTransformProps);

  // TODO: perspective, before translate
  return sortedTransformKeys.reduce((result, key) => {
    if (transformKeyAlias.has(key)) {
      result += ` ${transformKeyAlias.get(key)}(${transformProperties[key]}${keyToUnit.get(key) ?? ''})`;
    } else {
      // TODO: assert that key is in transformProps
      result += ` ${key}(${transformProperties[key]}${keyToUnit.get(key) ?? ''})`;
    }
    return result;
  }, '');
}
