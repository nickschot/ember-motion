import {getDefaultValueType, getValueAsType} from "../value-types";

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

export function serializeValuesAsTransform(transformProperties) {
  const sortedTransformKeys = Object.keys(transformProperties).sort(sortTransformProps);

  // TODO: perspective, before translate
  return sortedTransformKeys.reduce((result, _key) => {
    const key = transformKeyAlias.get(_key) ?? _key;
    const type = getDefaultValueType(key);
    const value = getValueAsType(transformProperties[_key], type);
    result += ` ${key}(${value})`;
    return result;
  }, '');
}
