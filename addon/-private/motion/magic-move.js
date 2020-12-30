import {decomposeTransform} from "../transform/decompose";
import {toRadians} from "../util";

export function calculateMagicMove({
  sourceTransform,
  targetTransform,
  sourceBoundingClientRect,
  targetBoundingClientRect
}) {
  const source = decomposeTransform(sourceTransform);
  const target = decomposeTransform(targetTransform);

  const scaleX = source.scaleX / target.scaleX;
  const scaleY = source.scaleY / target.scaleY;

  const skewX = source.skewX - target.skewX;
  const skewY = source.skewY - target.skewY;

  const rotate = source.rotate - target.rotate;

  // diff between the source transform origin & target transform origin
  // TODO: allow different origins than 50%/50%
  let x = (sourceBoundingClientRect.x + sourceBoundingClientRect.width / 2) - (targetBoundingClientRect.x + targetBoundingClientRect.width / 2);
  let y = (sourceBoundingClientRect.y + sourceBoundingClientRect.height / 2) - (targetBoundingClientRect.y + targetBoundingClientRect.height / 2);

  // scale correction
  x /= target.scaleX;
  y /= target.scaleY;

  // rotation correction
  const rotate_rad = -1 * toRadians(target.rotate);

  // compensate for translateY based on rotation
  let y_d1 = y - Math.cos(rotate_rad) * y;
  let x_d1 = Math.sin(rotate_rad) * y;

  // compensate for translateX based on rotation
  let x_d2 = x - Math.cos(rotate_rad) * x;
  let y_d2 = Math.sin(rotate_rad) * x;

  x -= x_d1;
  y -= y_d1;
  x -= x_d2;
  y += y_d2;

  /*
    // skew correction
    let x_delta = Math.tan(toRadians(decomposedTargetMatrix.skewX)) * y;
    let y_delta = Math.tan(toRadians(decomposedTargetMatrix.skewY)) * x;

    x -= x_delta;
    y -= y_delta;

    let skewed_x = x * Math.cos(toRadians(decomposedTargetMatrix.skewY));
    let skewed_y = y * Math.cos(toRadians(decomposedTargetMatrix.skewX));

    let scaleX_delta = skewed_x / x;
    let scaleY_delta = skewed_y / y;
    scaleX_delta = isNaN(scaleX_delta) ? 0 : scaleX_delta;
    scaleY_delta = isNaN(scaleY_delta) ? 0 : scaleY_delta;

    scaleX *= scaleX_delta;
    scaleY *= scaleY_delta;

    rotate -= (skewX / 2 + skewY / 2);
  */

  return {
    x,
    y,
    scaleX,
    scaleY,
    rotate,
    skewX,
    skewY
  };
}
