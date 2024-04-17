import { isNotNullish, isNullish, isNumber, isString, pojo } from '@sequelize/utils';
import { filter, filterOut } from './filter.ts';

function isElement(element: unknown): element is Element {
  return element instanceof Element;
}

function isHtmlInputElement(element: unknown): element is HTMLInputElement {
  return isElement(element) && element.nodeName === 'INPUT';
}

type FormElementValue = string | number | boolean | Array<string | number> | null;

export function getFormValue(form: HTMLFormElement, elementName: string): FormElementValue {
  const element = form.elements.namedItem(elementName);
  if (!element) {
    throw new Error(`This form has no element named ${elementName}`);
  }

  return getFormElementValue(element);
}

export function getFormValues(form: HTMLFormElement): Record<string, FormElementValue> {
  const out: Record<string, FormElementValue> = pojo();

  for (const element of form.elements) {
    // @ts-expect-error -- we treat unnamed elements and unnameable elements identically
    const name = element.name;

    /** some .elements don't contain any data (eg. buttons) */
    if (!name) {
      continue;
    }

    /**
     * .namedItems returns an array when two elements have the same key
     * so no need to process them twice
     */
    if (out[name]) {
      continue;
    }

    const normalizedElement = form.elements.namedItem(name);

    isNotNullish.assert(normalizedElement);

    out[name] = getFormElementValue(normalizedElement);
  }

  return out;
}

export function getFormElementValue(element: Element | RadioNodeList): FormElementValue {
  if (element instanceof RadioNodeList) {
    return getRadioNodeListValue(element);
  }

  // @ts-expect-error -- arbitrary elements without a common interface can have the form & name properties
  const elementGroup = element.form && element.name ? element.form.elements[element.name] : null;
  if (elementGroup && elementGroup instanceof RadioNodeList) {
    /** don't include the value of disabled elements, or nodes that are not elements (such as text) */
    const elements = [...filterOut(filter(elementGroup, isElement), isDisabledElement)];
    if (elements.length === 1) {
      return getSingleFormElementValue(elements[0]);
    }

    return getRadioNodeListValue(elementGroup);
  }

  return getSingleFormElementValue(element);
}

export function isDisabledElement(element: Element): boolean {
  return (
    ('disabled' in element && Boolean(element.disabled)) ||
    element.getAttribute('aria-disabled') === 'true'
  );
}

function getSingleFormElementValue(element: Node): string | number | null | boolean {
  if (isHtmlInputElement(element)) {
    /**
     * a checkbox will either be returned as its checked state (if .value is empty, boolean) - this is the "Switch" use case
     * or as its value (if not empty) - this is the multiple checkboxes use case
     */
    if (element.type === 'checkbox') {
      if (isNullish(element.getAttribute('value')) || element.value === '') {
        return element.checked;
      }

      return element.checked ? element.value : '';
    }

    if (element.type === 'number') {
      if (Number.isNaN(element.valueAsNumber)) {
        return null;
      }

      return element.valueAsNumber;
    }

    return element.value;
  }

  if (element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
    return element.value;
  }

  throw new Error(`Unsupported element type ${element.nodeName}`);
}

function getRadioNodeListValue(radioList: RadioNodeList): string | number | Array<string | number> {
  /** This is the RadioNodeList of an input of type="radio" */
  if (radioList.value) {
    return radioList.value;
  }

  const firstElement = radioList.item(0);
  if (isHtmlInputElement(firstElement) && firstElement.type === 'radio') {
    return '';
  }

  /** This is the RadioNodeList of an input of type="checkbox" */
  const values: Array<string | number> = [];
  for (const checkbox of radioList) {
    const value = getSingleFormElementValue(checkbox);
    if (value && (isNumber(value) || isString(value))) {
      values.push(value);
    }
  }

  return values;
}
