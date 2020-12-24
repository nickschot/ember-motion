import { camelize } from '@ember/string';

export const getPosFromMatrix = (matrix, pos) =>
  parseFloat(matrix.split(', ')[pos])

export const getTranslateFromMatrix = (
  pos2,
  pos3
) => (_bbox, { transform }) => {
  if (transform === "none" || !transform) return 0

  const matrix3d = transform.match(/^matrix3d\((.+)\)$/)

  if (matrix3d) {
    return getPosFromMatrix(matrix3d[1], pos3)
  } else {
    const matrix = transform.match(/^matrix\((.+)\)$/)
    if (matrix) {
      return getPosFromMatrix(matrix[1], pos2)
    } else {
      return 0
    }
  }
}

export const positionalValues = {
  // Dimensions
  width: ({ x }) => x.max - x.min,
  height: ({ y }) => y.max - y.min,

  top: (_bbox, { top }) => parseFloat(top),
  left: (_bbox, { left }) => parseFloat(left),
  bottom: ({ y }, { top }) => parseFloat(top) + (y.max - y.min),
  right: ({ x }, { left }) => parseFloat(left) + (x.max - x.min),

  // Transform
  x: getTranslateFromMatrix(4, 13),
  y: getTranslateFromMatrix(5, 14),
}

export const transformValues = [
  'x',
  'y',
  'z',
  'rotate',
  'rotateX',
  'rotateY',
  'rotateZ',
  'scaleX',
  'scaleY',
  'scale',
];

export function copyComputedStyle(element) {
  let computed = getComputedStyle(element);
  let output = {};
  for (let property of COPIED_CSS_PROPERTIES) {
    // set both border-color and borderColor properties
    output[property] = computed.getPropertyValue(property);
    output[camelize(property)] = output[property];
  }
  return Object.freeze(output);
}

export const COPIED_CSS_PROPERTIES = [
  'opacity',
  'font-size',
  'font-family',
  'font-weight',
  'color',
  'background-color',
  'border-color',
  'letter-spacing',
  'line-height',
  'text-align',
  'text-transform',
  'padding',
  'padding-top',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'border-radius',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'box-shadow',

  'transform'
];

export function getRelativeBoundingBox(parentBoundingBox, childBoundingBox) {
  return {
    top: childBoundingBox.top - parentBoundingBox.top,
    right: childBoundingBox.right - parentBoundingBox.right,
    bottom: childBoundingBox.bottom - parentBoundingBox.bottom,
    left: childBoundingBox.left - parentBoundingBox.left,
  };
}
