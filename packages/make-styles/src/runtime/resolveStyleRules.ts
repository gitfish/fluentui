import hashString from '@emotion/hash';
import { convertProperty } from 'rtl-css-js/core';
import { expand } from 'inline-style-expand-shorthand';

import { HASH_PREFIX, RTL_PREFIX } from '../constants';
import { MakeStyles, MakeStylesResolvedRule } from '../types';
import { compileCSS } from './compileCSS';
import { compileKeyframeRule } from './compileKeyframeRule';
import { isMediaQuerySelector } from './utils/isMediaQuerySelector';
import { isNestedSelector } from './utils/isNestedSelector';
import { isObject } from './utils/isObject';
import { normalizeNestedProperty } from './utils/normalizeNestedProperty';

export function resolveStyleRules(
  styles: MakeStyles,
  unstable_cssPriority: number = 0,
  selector = '',
  result: Record<string, MakeStylesResolvedRule> = {},
): Record<string, MakeStylesResolvedRule> {
  const expandedStyles = (expand(styles) as unknown) as MakeStyles;
  const properties = Object.keys(expandedStyles);

  // TODO: => for-in loop
  properties.forEach(propName => {
    const propValue = expandedStyles[propName];

    // eslint-disable-next-line eqeqeq
    if (propValue == null) {
      return;
    } else if (typeof propValue === 'string' || typeof propValue === 'number') {
      // uniq key based on property & selector, used for merging later
      const key = selector + propName;

      const className =
        HASH_PREFIX +
        hashString(selector + propName + propValue) +
        (unstable_cssPriority === 0 ? '' : unstable_cssPriority);
      const css = compileCSS(className, selector, propName, propValue, unstable_cssPriority);

      const rtl = convertProperty(propName, propValue);
      const flippedInRtl = rtl.key !== propName || rtl.value !== propValue;

      if (flippedInRtl) {
        const rtlCSS = compileCSS(RTL_PREFIX + className, selector, rtl.key, rtl.value, unstable_cssPriority);

        // There is no sense to store RTL className as it's "r" + regular className
        result[key] = [className, css, rtlCSS];
      } else {
        result[key] = [className, css];
      }
    } else if (isObject(propValue)) {
      if (isNestedSelector(propName)) {
        resolveStyleRules(propValue, unstable_cssPriority, selector + normalizeNestedProperty(propName), result);
      } else if (isMediaQuerySelector(propName)) {
        resolveStyleRules(propValue, unstable_cssPriority, selector + propName, result);
      } else if (propName === 'animationName') {
        // TODO: support RTL!
        const keyframe = compileKeyframeRule(propValue);
        const animationName = HASH_PREFIX + hashString(keyframe);

        // TODO call Stylis for prefixing
        const keyframeCSS = `@keyframes ${animationName}{${keyframe}}`;

        result[animationName] = [animationName, keyframeCSS /* rtlCSS */];

        resolveStyleRules({ animationName }, unstable_cssPriority, selector, result);
      }
      // TODO: support support queries
    }
  });

  return result;
}
