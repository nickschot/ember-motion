function determinant(matrix) {
  const [
    m00,
    m01,
    m02,
    m03,
    m10,
    m11,
    m12,
    m13,
    m20,
    m21,
    m22,
    m23,
    m30,
    m31,
    m32,
    m33,
  ] = matrix;
  return (
    m03 * m12 * m21 * m30 -
    m02 * m13 * m21 * m30 -
    m03 * m11 * m22 * m30 +
    m01 * m13 * m22 * m30 +
    m02 * m11 * m23 * m30 -
    m01 * m12 * m23 * m30 -
    m03 * m12 * m20 * m31 +
    m02 * m13 * m20 * m31 +
    m03 * m10 * m22 * m31 -
    m00 * m13 * m22 * m31 -
    m02 * m10 * m23 * m31 +
    m00 * m12 * m23 * m31 +
    m03 * m11 * m20 * m32 -
    m01 * m13 * m20 * m32 -
    m03 * m10 * m21 * m32 +
    m00 * m13 * m21 * m32 +
    m01 * m10 * m23 * m32 -
    m00 * m11 * m23 * m32 -
    m02 * m11 * m20 * m33 +
    m01 * m12 * m20 * m33 +
    m02 * m10 * m21 * m33 -
    m00 * m12 * m21 * m33 -
    m01 * m10 * m22 * m33 +
    m00 * m11 * m22 * m33
  );
}

/**
 * Inverse of a matrix. Multiplying by the inverse is used in matrix math
 * instead of division.
 *
 * Formula from:
 * http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
 */
function inverse(matrix) {
  const det = determinant(matrix);
  if (!det) {
    return matrix;
  }
  const [
    m00,
    m01,
    m02,
    m03,
    m10,
    m11,
    m12,
    m13,
    m20,
    m21,
    m22,
    m23,
    m30,
    m31,
    m32,
    m33,
  ] = matrix;
  return [
    (m12 * m23 * m31 -
      m13 * m22 * m31 +
      m13 * m21 * m32 -
      m11 * m23 * m32 -
      m12 * m21 * m33 +
      m11 * m22 * m33) /
    det,
    (m03 * m22 * m31 -
      m02 * m23 * m31 -
      m03 * m21 * m32 +
      m01 * m23 * m32 +
      m02 * m21 * m33 -
      m01 * m22 * m33) /
    det,
    (m02 * m13 * m31 -
      m03 * m12 * m31 +
      m03 * m11 * m32 -
      m01 * m13 * m32 -
      m02 * m11 * m33 +
      m01 * m12 * m33) /
    det,
    (m03 * m12 * m21 -
      m02 * m13 * m21 -
      m03 * m11 * m22 +
      m01 * m13 * m22 +
      m02 * m11 * m23 -
      m01 * m12 * m23) /
    det,
    (m13 * m22 * m30 -
      m12 * m23 * m30 -
      m13 * m20 * m32 +
      m10 * m23 * m32 +
      m12 * m20 * m33 -
      m10 * m22 * m33) /
    det,
    (m02 * m23 * m30 -
      m03 * m22 * m30 +
      m03 * m20 * m32 -
      m00 * m23 * m32 -
      m02 * m20 * m33 +
      m00 * m22 * m33) /
    det,
    (m03 * m12 * m30 -
      m02 * m13 * m30 -
      m03 * m10 * m32 +
      m00 * m13 * m32 +
      m02 * m10 * m33 -
      m00 * m12 * m33) /
    det,
    (m02 * m13 * m20 -
      m03 * m12 * m20 +
      m03 * m10 * m22 -
      m00 * m13 * m22 -
      m02 * m10 * m23 +
      m00 * m12 * m23) /
    det,
    (m11 * m23 * m30 -
      m13 * m21 * m30 +
      m13 * m20 * m31 -
      m10 * m23 * m31 -
      m11 * m20 * m33 +
      m10 * m21 * m33) /
    det,
    (m03 * m21 * m30 -
      m01 * m23 * m30 -
      m03 * m20 * m31 +
      m00 * m23 * m31 +
      m01 * m20 * m33 -
      m00 * m21 * m33) /
    det,
    (m01 * m13 * m30 -
      m03 * m11 * m30 +
      m03 * m10 * m31 -
      m00 * m13 * m31 -
      m01 * m10 * m33 +
      m00 * m11 * m33) /
    det,
    (m03 * m11 * m20 -
      m01 * m13 * m20 -
      m03 * m10 * m21 +
      m00 * m13 * m21 +
      m01 * m10 * m23 -
      m00 * m11 * m23) /
    det,
    (m12 * m21 * m30 -
      m11 * m22 * m30 -
      m12 * m20 * m31 +
      m10 * m22 * m31 +
      m11 * m20 * m32 -
      m10 * m21 * m32) /
    det,
    (m01 * m22 * m30 -
      m02 * m21 * m30 +
      m02 * m20 * m31 -
      m00 * m22 * m31 -
      m01 * m20 * m32 +
      m00 * m21 * m32) /
    det,
    (m02 * m11 * m30 -
      m01 * m12 * m30 -
      m02 * m10 * m31 +
      m00 * m12 * m31 +
      m01 * m10 * m32 -
      m00 * m11 * m32) /
    det,
    (m01 * m12 * m20 -
      m02 * m11 * m20 +
      m02 * m10 * m21 -
      m00 * m12 * m21 -
      m01 * m10 * m22 +
      m00 * m11 * m22) /
    det,
  ];
}

/**
 * Turns columns into rows and rows into columns.
 */
function transpose(m) {
  return [
    m[0],
    m[4],
    m[8],
    m[12],
    m[1],
    m[5],
    m[9],
    m[13],
    m[2],
    m[6],
    m[10],
    m[14],
    m[3],
    m[7],
    m[11],
    m[15],
  ];
}

function multiplyVectorByMatrix(v, m) {
  const [vx, vy, vz, vw] = v;
  return [
    vx * m[0] + vy * m[4] + vz * m[8] + vw * m[12],
    vx * m[1] + vy * m[5] + vz * m[9] + vw * m[13],
    vx * m[2] + vy * m[6] + vz * m[10] + vw * m[14],
    vx * m[3] + vy * m[7] + vz * m[11] + vw * m[15],
  ];
}

/**
 * From: https://code.google.com/p/webgl-mjs/source/browse/mjs.js
 */
function v3Length(a) {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
}

/**
 * Based on: https://code.google.com/p/webgl-mjs/source/browse/mjs.js
 */
function v3Normalize(vector, v3Length) {
  const im = 1 / (v3Length || v3Length(vector));
  return [vector[0] * im, vector[1] * im, vector[2] * im];
}

/**
 * The dot product of a and b, two 3-element vectors.
 * From: https://code.google.com/p/webgl-mjs/source/browse/mjs.js
 */
function v3Dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * From:
 * http://www.opensource.apple.com/source/WebCore/WebCore-514/platform/graphics/transforms/TransformationMatrix.cpp
 */
function v3Combine(
  a,
  b,
  aScale,
  bScale,
) {
  return [
    aScale * a[0] + bScale * b[0],
    aScale * a[1] + bScale * b[1],
    aScale * a[2] + bScale * b[2],
  ];
}

/**
 * From:
 * http://www.opensource.apple.com/source/WebCore/WebCore-514/platform/graphics/transforms/TransformationMatrix.cpp
 */
function v3Cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/**
 * Based on:
 * http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToEuler/
 * and:
 * http://quat.zachbennett.com/
 *
 * Note that this rounds degrees to the thousandth of a degree, due to
 * floating point errors in the creation of the quaternion.
 *
 * Also note that this expects the qw value to be last, not first.
 *
 * Also, when researching this, remember that:
 * yaw   === heading            === z-axis
 * pitch === elevation/attitude === y-axis
 * roll  === bank               === x-axis
 */
function quaternionToDegreesXYZ(q/*, matrix, row*/) {
  const [qx, qy, qz, qw] = q;
  const qw2 = qw * qw;
  const qx2 = qx * qx;
  const qy2 = qy * qy;
  const qz2 = qz * qz;
  const test = qx * qy + qz * qw;
  const unit = qw2 + qx2 + qy2 + qz2;
  const conv = 180 / Math.PI;

  if (test > 0.49999 * unit) {
    return [0, 2 * Math.atan2(qx, qw) * conv, 90];
  }
  if (test < -0.49999 * unit) {
    return [0, -2 * Math.atan2(qx, qw) * conv, -90];
  }

  return [
    roundTo3Places(
      Math.atan2(2 * qx * qw - 2 * qy * qz, 1 - 2 * qx2 - 2 * qz2) * conv,
    ),
    roundTo3Places(
      Math.atan2(2 * qy * qw - 2 * qx * qz, 1 - 2 * qy2 - 2 * qz2) * conv,
    ),
    roundTo3Places(Math.asin(2 * qx * qy + 2 * qz * qw) * conv),
  ];
}

/**
 * Based on:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
 */
function roundTo3Places(n) {
  const arr = n.toString().split('e');
  return Math.round(arr[0] + 'e' + (arr[1] ? +arr[1] - 3 : 3)) * 0.001;
}

/**
 * Decompose a Transform instance
 *
 * @param t
 * @returns {{rotate: *, skewX: number, scale: [], skewY: number, scaleX: *, scaleY: *, quaternion: [], translateY: *, skewZ: number, rotationDegrees, translateX: *, translation: [], perspective: [], rotateX: *, rotateY: *, skew: []}}
 */
export function decomposeTransform(t) {
  const transformMatrix = [
    t.a, t.b, 0, 0,
    t.c, t.d, 0, 0,
    0, 0, 1, 0,
    t.tx, t.ty, 0, 1
  ];

  // output values
  let perspective = [];
  const quaternion = [];
  const scale = [];
  const skew = [];
  const translation = [];

  // create normalized, 2d array matrix
  // and normalized 1d array perspectiveMatrix with redefined 4th column
  if (!transformMatrix[15]) {
    return;
  }
  const matrix = [];
  const perspectiveMatrix = [];
  for (let i = 0; i < 4; i++) {
    matrix.push([]);
    for (let j = 0; j < 4; j++) {
      const value = transformMatrix[i * 4 + j] / transformMatrix[15];
      matrix[i].push(value);
      perspectiveMatrix.push(j === 3 ? 0 : value);
    }
  }
  perspectiveMatrix[15] = 1;

  // test for singularity of upper 3x3 part of the perspective matrix
  if (!determinant(perspectiveMatrix)) {
    return;
  }

  // isolate perspective
  if (matrix[0][3] !== 0 || matrix[1][3] !== 0 || matrix[2][3] !== 0) {
    // rightHandSide is the right hand side of the equation.
    // rightHandSide is a vector, or point in 3d space relative to the origin.
    const rightHandSide = [
      matrix[0][3],
      matrix[1][3],
      matrix[2][3],
      matrix[3][3],
    ];

    // Solve the equation by inverting perspectiveMatrix and multiplying
    // rightHandSide by the inverse.
    const inversePerspectiveMatrix = inverse(perspectiveMatrix);
    const transposedInversePerspectiveMatrix = transpose(
      inversePerspectiveMatrix,
    );
    perspective = multiplyVectorByMatrix(
      rightHandSide,
      transposedInversePerspectiveMatrix,
    );
  } else {
    // no perspective
    perspective[0] = perspective[1] = perspective[2] = 0;
    perspective[3] = 1;
  }

  // translation is simple
  for (let i = 0; i < 3; i++) {
    translation[i] = matrix[3][i];
  }

  // Now get scale and shear.
  // 'row' is a 3 element array of 3 component vectors
  const row = [];
  for (let i = 0; i < 3; i++) {
    row[i] = [matrix[i][0], matrix[i][1], matrix[i][2]];
  }

  // Compute X scale factor and normalize first row.
  scale[0] = v3Length(row[0]);
  row[0] = v3Normalize(row[0], scale[0]);

  // Compute XY shear factor and make 2nd row orthogonal to 1st.
  skew[0] = v3Dot(row[0], row[1]);
  row[1] = v3Combine(row[1], row[0], 1.0, -skew[0]);

  // Now, compute Y scale and normalize 2nd row.
  scale[1] = v3Length(row[1]);
  row[1] = v3Normalize(row[1], scale[1]);
  skew[0] /= scale[1];

  // Compute XZ and YZ shears, orthogonalize 3rd row
  skew[1] = v3Dot(row[0], row[2]);
  row[2] = v3Combine(row[2], row[0], 1.0, -skew[1]);
  skew[2] = v3Dot(row[1], row[2]);
  row[2] = v3Combine(row[2], row[1], 1.0, -skew[2]);

  // Next, get Z scale and normalize 3rd row.
  scale[2] = v3Length(row[2]);
  row[2] = v3Normalize(row[2], scale[2]);
  skew[1] /= scale[2];
  skew[2] /= scale[2];

  // At this point, the matrix (in rows) is orthonormal.
  // Check for a coordinate system flip.  If the determinant
  // is -1, then negate the matrix and the scaling factors.
  const pdum3 = v3Cross(row[1], row[2]);
  if (v3Dot(row[0], pdum3) < 0) {
    for (let i = 0; i < 3; i++) {
      scale[i] *= -1;
      row[i][0] *= -1;
      row[i][1] *= -1;
      row[i][2] *= -1;
    }
  }

  // Now, get the rotations out
  quaternion[0] =
    0.5 * Math.sqrt(Math.max(1 + row[0][0] - row[1][1] - row[2][2], 0));
  quaternion[1] =
    0.5 * Math.sqrt(Math.max(1 - row[0][0] + row[1][1] - row[2][2], 0));
  quaternion[2] =
    0.5 * Math.sqrt(Math.max(1 - row[0][0] - row[1][1] + row[2][2], 0));
  quaternion[3] =
    0.5 * Math.sqrt(Math.max(1 + row[0][0] + row[1][1] + row[2][2], 0));

  if (row[2][1] > row[1][2]) {
    quaternion[0] = -quaternion[0];
  }
  if (row[0][2] > row[2][0]) {
    quaternion[1] = -quaternion[1];
  }
  if (row[1][0] > row[0][1]) {
    quaternion[2] = -quaternion[2];
  }

  // correct for occasional, weird Euler synonyms for 2d rotation
  let rotationDegrees;
  if (
    quaternion[0] < 0.001 &&
    quaternion[0] >= 0 &&
    quaternion[1] < 0.001 &&
    quaternion[1] >= 0
  ) {
    // this is a 2d rotation on the z-axis
    rotationDegrees = [
      0,
      0,
      roundTo3Places(
        (Math.atan2(row[0][1], row[0][0]) * 180) / Math.PI,
      ),
    ];
  } else {
    rotationDegrees = quaternionToDegreesXYZ(
      quaternion,
      matrix,
      row,
    );
  }

  // expose both base data and convenience names
  return {
    rotationDegrees,
    perspective,
    quaternion,
    scale,
    skew,
    translation,

    rotate: rotationDegrees[2],
    rotateX: rotationDegrees[0],
    rotateY: rotationDegrees[1],
    scaleX: scale[0],
    scaleY: scale[1],
    translateX: translation[0],
    translateY: translation[1],

    skewX: Math.atan(skew[0]) * 180/Math.PI,
    skewY: Math.atan(skew[1]) * 180/Math.PI,
    skewZ: Math.atan(skew[2]) * 180/Math.PI,
  };
}
