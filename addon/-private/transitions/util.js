/* eslint-disable no-unused-vars */
export function isTransitionDefined({
  when,
  delay,
  delayChildren,
  staggerChildren,
  staggerDirection,
  repeat,
  repeatType,
  repeatDelay,
  from,
  ...transition
}) {
  return !!Object.keys(transition).length;
}
/* eslint-enable no-unused-vars */
