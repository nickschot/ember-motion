export const DELTA_TIME_MS = 1 / 60 * 1000; // 1 frame, 60 FPS

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isSpringOvershooting({stiffness, fromValue, toValue, overshootClamping, value}) {
  let isOvershooting = false;
  if (overshootClamping && stiffness !== 0) {
    if (fromValue < toValue) {
      isOvershooting = value > toValue;
    } else {
      isOvershooting = value < toValue;
    }
  }
  return isOvershooting;
}

function isSpringAtRest({stiffness, toValue, restDisplacementThreshold, restVelocityThreshold, value, velocity}) {
  const isNoVelocity = Math.abs(velocity) <= restVelocityThreshold;
  const isNoDisplacement = stiffness !== 0 && Math.abs(toValue - value) <= restDisplacementThreshold;
  return isNoDisplacement && isNoVelocity;
}

function advanceSpringToTime(
  timestamp,
  {
    damping: c,
    mass: m,
    stiffness: k,
    fromValue,
    toValue,
    initialVelocity: v0,
    allowsOverdamping,
    overshootClamping,
    restDisplacementThreshold,
    restVelocityThreshold
  }
) {
  invariant(m > 0, "Mass value must be greater than 0");
  invariant(k > 0, "Stiffness value must be greater than 0");
  invariant(c > 0, "Damping value must be greater than 0");

  let zeta = c / (2 * Math.sqrt(k * m)); // damping ratio (dimensionless)
  const omega0 = Math.sqrt(k / m) / 1000; // undamped angular frequency of the oscillator (rad/ms)
  const omega1 = omega0 * Math.sqrt(1.0 - zeta * zeta); // exponential decay
  const omega2 = omega0 * Math.sqrt(zeta * zeta - 1.0); // frequency of damped oscillation
  const x0 = toValue - fromValue; // initial displacement of the spring at t = 0

  if (zeta > 1 && !allowsOverdamping) {
    zeta = 1;
  }

  let oscillation = 0.0;
  let velocity = 0.0;
  const t = timestamp;
  if (zeta < 1) {
    // Under damped
    const envelope = Math.exp(-zeta * omega0 * t);
    oscillation =
      toValue -
      envelope *
      ((v0 + zeta * omega0 * x0) / omega1 * Math.sin(omega1 * t) +
        x0 * Math.cos(omega1 * t));
    // This looks crazy -- it's actually just the derivative of the
    // oscillation function
    velocity =
      zeta *
      omega0 *
      envelope *
      (Math.sin(omega1 * t) * (v0 + zeta * omega0 * x0) / omega1 +
        x0 * Math.cos(omega1 * t)) -
      envelope *
      (Math.cos(omega1 * t) * (v0 + zeta * omega0 * x0) -
        omega1 * x0 * Math.sin(omega1 * t));
  } else if (zeta === 1) {
    // Critically damped
    const envelope = Math.exp(-omega0 * t);
    oscillation = toValue - envelope * (x0 + (v0 + omega0 * x0) * t);
    velocity =
      envelope * (v0 * (t * omega0 - 1) + t * x0 * (omega0 * omega0));
  } else {
    // Overdamped
    const envelope = Math.exp(-zeta * omega0 * t);
    oscillation =
      toValue -
      envelope *
      ((v0 + zeta * omega0 * x0) * Math.sinh(omega2 * t) +
        omega2 * x0 * Math.cosh(omega2 * t)) /
      omega2;
    velocity =
      envelope *
      zeta *
      omega0 *
      (Math.sinh(omega2 * t) * (v0 + zeta * omega0 * x0) +
        x0 * omega2 * Math.cosh(omega2 * t)) /
      omega2 -
      envelope *
      (omega2 * Math.cosh(omega2 * t) * (v0 + zeta * omega0 * x0) +
        omega2 * omega2 * x0 * Math.sinh(omega2 * t)) /
      omega2;
  }

  // If the Spring is overshooting (when overshoot clamping is on), or if the
  // spring is at rest (based on the thresholds set in the config), stop the
  // animation.
  if ((isSpringOvershooting({
    stiffness: k,
    fromValue,
    toValue,
    overshootClamping,
    value: oscillation
  }) || isSpringAtRest({
    stiffness: k,
    toValue,
    restDisplacementThreshold,
    restVelocityThreshold,
    value: oscillation,
    velocity
  })) && k !== 0) {
    // Ensure that we end up with a round value
    return {
      time: timestamp,
      value: toValue,
      velocity: 0
    };
  }

  return {
    time: timestamp,
    value: oscillation,
    velocity
  };
}

export default function springToKeyframes(options) {
  const config = {
    fromValue: 0,
    toValue: 1,
    stiffness: 100,
    damping: 10,
    mass: 1,
    initialVelocity: 0,
    overshootClamping: false,
    allowsOverdamping: false,
    restVelocityThreshold: 0.001,
    restDisplacementThreshold: 0.001,
    deltaTimeMs: DELTA_TIME_MS,
    ...options
  };

  const {
    fromValue,
    toValue,
    stiffness,
    initialVelocity,
    restVelocityThreshold,
    restDisplacementThreshold,
    deltaTimeMs,
  } = config;

  let frames = [];
  let time = 0;
  let value = fromValue;
  let velocity = initialVelocity;
  while (!isSpringAtRest({stiffness, toValue, restDisplacementThreshold, restVelocityThreshold, value, velocity})) {
    const frame = advanceSpringToTime(time, config);
    time += deltaTimeMs;
    value = frame.value;
    velocity = frame.velocity;
    frames.push(frame);
  }
  return frames;
}

/**
 * Returns the closest frame for the given progress.
 *
 * @param progress Number between 0 and 1
 * @param frames
 * @returns {*}
 */
export function progressToFrame(progress, frames) {
  const index = Math.round(frames.length * progress);
  return frames[index];
}

/**
 * Returns the interpolated velocity value for the given progress.
 *
 * @param progress Number between 0 and 1
 * @param frames
 * @returns {*}
 */
export function progressToInterpolatedVelocity(progress, frames) {
  const rawIndex = (frames.length - 1) * progress;
  const lowerIndex = Math.floor(rawIndex);
  const upperIndex = Math.ceil(rawIndex);

  const multiplier = rawIndex - lowerIndex;
  return frames[lowerIndex].velocity + multiplier * (frames[upperIndex].velocity - frames[lowerIndex].velocity);
}
