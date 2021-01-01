import { serializeValuesAsTransform } from '../transform/serialize';
import springToKeyframes from '../interpolation/spring';
import { getDefaultTransition, linearTween } from '../transitions/default';

export function getTransformAnimation(element, toValues, fromValues, transition) {
  // TODO: what if we don't have x/y ???
  let springFrom = Math.sqrt(Math.pow(fromValues.x ?? 0, 2) + Math.pow(fromValues.y ?? 0, 2));
  let springTo = Math.sqrt(Math.pow(toValues.x ?? 0, 2) + Math.pow(toValues.y ?? 0, 2));

  const fromTransformString = serializeValuesAsTransform(fromValues);
  const toTransformString = serializeValuesAsTransform(toValues);

  console.log('FROM: ', fromTransformString);
  console.log('TO: ', toTransformString);

  if (fromTransformString === toTransformString || (springFrom === 0 && springTo === springFrom)) {
    return element.animate(
      [
        {
          transform: fromTransformString,
        },
        {
          transform: toTransformString,
        },
      ],
      {
        fill: 'both',
        easing: 'linear',
        duration: 0,
        composite: 'replace',
      }
    );
  }

  const type = transition?.type ?? 'spring';
  let keyframes = [];
  let options = {
    fill: 'both',
    easing: 'linear',
    composite: 'replace',
  };

  // TODO: add tween support
  if (type === 'spring') {
    const frames = springToKeyframes({
      fromValue: 0,
      initialVelocity: 0,
      ...getDefaultTransition('x', springTo - springFrom),
      ...transition,
    });

    options.duration = frames[frames.length - 1].time;
    // TODO: implement this as a callback in the spring so we can save doing this map operation
    keyframes = frames.map(({ value }) => {
      const scalar = value / (springTo - springFrom);
      const frame = Object.fromEntries(
        Object.entries(toValues).map(([key, toValue]) => [
          key,
          (fromValues[key] ?? 0) + scalar * (toValue - (fromValues[key] ?? 0)),
        ])
      );

      return {
        transform: serializeValuesAsTransform(frame),
      };
    });
  } else if (transition.type === 'tween') {
    keyframes = [
      {
        transform: fromTransformString,
      },
      {
        transform: toTransformString,
      },
    ];
    options = {
      ...options,
      ...linearTween(),
      ...transition,
    };
  }

  return {
    animation: element.animate(keyframes, options),
    duration: options.duration,
  };
}
