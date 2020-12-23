export const underDampedSpring = () => ({
  type: 'spring',
  mass: 0.5,
  stiffness: 500,
  damping: 25,
  restDisplacementThreshold: 0.5,
  restVelocityThreshold: 10,
});

export const overDampedSpring = (toValue) => ({
  type: 'spring',
  mass: 0.5,
  stiffness: 550,
  damping: toValue === 0 ? 100 : 30,
  restDisplacementThreshold: 0.01,
  restVelocityThreshold: 10,
  allowsOverdamping: true
});

export const linearTween = () => ({
  type: "tween",
  easing: "linear",
  duration: 300,
})

const defaultTransitions = {
  x: underDampedSpring,
  y: underDampedSpring,
  z: underDampedSpring,
  rotate: underDampedSpring,
  rotateX: underDampedSpring,
  rotateY: underDampedSpring,
  rotateZ: underDampedSpring,
  scaleX: overDampedSpring,
  scaleY: overDampedSpring,
  scale: overDampedSpring,
  opacity: linearTween,
  backgroundColor: linearTween,
  color: linearTween,
  default: overDampedSpring,

  borderColor: linearTween
}

export const getDefaultTransition = (
  valueKey,
  toValue
) => {
  let transitionFactory = defaultTransitions[valueKey] || defaultTransitions.default

  return { toValue, ...transitionFactory(toValue) };
}
