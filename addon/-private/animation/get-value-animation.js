import { getDefaultTransition } from '../transitions/default';
import springToKeyframes from '../interpolation/spring';
import { isTransitionDefined } from '../transitions/util';
import { getDefaultValueType, getValueAsType } from '../value-types';

export function getValueAnimation({ element, key, fromValue, toValue, transition, composite }) {
  const options = {
    fromValue,
    toValue,
    initialVelocity: 0,
  };

  // TODO: detect from/to type from value & store those so we can reuse them after interpolation
  const type = getDefaultValueType(key);

  // if the values are identical, apply an animation with a duration of 0 so we at least have the styles applied
  if (
    options.fromValue == options.toValue ||
    (!isNaN(parseFloat(options.fromValue)) && parseFloat(options.fromValue) === parseFloat(options.toValue))
  ) {
    return element.animate(
      [{ [key]: getValueAsType(options.fromValue, type) }, { [key]: getValueAsType(options.toValue, type) }],
      {
        fill: 'both',
        easing: 'linear',
        duration: 0,
        composite,
      }
    );
  }

  const animation = isTransitionDefined(transition)
    ? { ...options, ...transition }
    : { ...options, ...getDefaultTransition(key, toValue) };

  let keyframes = [];
  if (animation.type === 'tween') {
    animation.easing = animation.easing ?? 'linear';
    animation.duration = animation.duration ?? 300;
    keyframes = [
      { [key]: getValueAsType(animation.fromValue, type) },
      { [key]: getValueAsType(animation.toValue, type) },
    ];
  } else if (animation.type === 'spring') {
    let frames = springToKeyframes(animation);
    keyframes = frames.map(({ value }) => ({ [key]: getValueAsType(value, type) }));
    animation.duration = frames[frames.length - 1].time;
  }

  return element.animate(keyframes, {
    fill: 'both',
    easing: animation.easing,
    duration: animation.duration,
    composite,
  });
}
