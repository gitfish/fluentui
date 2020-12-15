import { compile, middleware, serialize, stringify } from 'stylis';
import { hyphenateProperty } from './utils/hyphenateProperty';

function repeatSelector(selector: string, times: number) {
  return new Array(times + 2).join(selector);
}

export function compileCSS(
  className: string,
  selector: string,
  property: string,
  value: number | string,
  unstable_cssPriority: number,
): string {
  const cssDeclaration = `{ ${hyphenateProperty(property)}: ${value}; }`;

  // Should be handled by namespace plugin of Stylis, is buggy now
  // Issues are reported:
  // https://github.com/thysultan/stylis.js/issues/253
  // https://github.com/thysultan/stylis.js/issues/252
  if (selector.indexOf(':global(') === 0) {
    const globalSelector = /global\((.+)\)/.exec(selector)?.[1];
    const classNameSelector = repeatSelector(`.${className}`, unstable_cssPriority);

    const shouldIncludeClassName = selector.indexOf('&') === selector.length - 1;
    const cssRule = shouldIncludeClassName
      ? `${globalSelector} { ${classNameSelector} ${cssDeclaration} }`
      : `${globalSelector} ${cssDeclaration}`;

    return serialize(compile(cssRule), middleware([stringify]));
  } else {
    const classNameSelector = repeatSelector(`.${className}`, unstable_cssPriority);
    const cssRule = `${classNameSelector} { ${selector || '&'} ${cssDeclaration} }`;

    return serialize(compile(cssRule), middleware([stringify]));
  }
}
