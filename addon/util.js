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
