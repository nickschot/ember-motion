import { toDegrees, toRadians } from "../util";

/**
 * Decompose a Transform instance matrix into it's components
 * @param transform
 * @returns {{scaleX: number, scaleY: number, rotate: *, translateY: *, translateX: *, skewX: *, skewY: *}}
 */
export function decomposeTransform(transform) {
  let {
    a,
    b,
    c,
    d,
    tx,
    ty
  } = transform;

  let translateX = tx;
  let translateY = ty;

  let scaleX = Math.sqrt(a * a + c * c);
  let scaleY = Math.sqrt(b * b + d * d);

  // If determinant is negative, one axis was flipped.
  // double determinant = row0x * row1y - row0y * row1x
  const determinant = a * d - c * b;
  if (determinant < 0) {
    // Flip axis with minimum unit vector dot product.
    if (a < d) {
      scaleX *= -1;
    } else {
      scaleY *= -1;
    }
  }

  // Renormalize matrix to remove scale.
  //if (scaleX !== 1) {
    a *= 1 / scaleX;
    c *= 1 / scaleX;
  //}
  //if (scaleY !== 1) {
    b *= 1 / scaleY;
    d *= 1 / scaleY;
  //}

  // Compute rotation and renormalize matrix.
  let angle = Math.atan2(b, a);

  if (angle) {
    // Rotate(-angle) = [cos(angle), sin(angle), -sin(angle), cos(angle)]
    //                = [row0x, -row0y, row0y, row0x]
    // Thanks to the normalization above.
    let sn = -1 * c;
    let cs = a;
    let m11 = a;
    let m12 = c;
    let m21 = b;
    let m22 = d;
    a = cs * m11 + sn * m21;
    c = cs * m12 + sn * m22;
    b = -sn * m11 + cs * m21;
    d = -sn * m12 + cs * m22;
  }

  let skewX = a * b + c * d;
  let skewY = a * c + b * d;

  let rotate = toDegrees(angle);

  return {
    translateX,
    translateY,
    scaleX,
    scaleY,
    rotate,
    skewX: toRadians(Math.atan(skewX)),
    skewY: toRadians(Math.atan(skewY)),
  }
}
