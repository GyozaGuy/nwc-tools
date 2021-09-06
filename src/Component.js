import { render } from 'uhtml';

import attrToPropName from './attrToPropName';
import propToAttrName from './propToAttrName';

const IGNORED_PROPS = ['_initialChildNodes', '_initialized', 'props'];

export class Component extends HTMLElement {
  _initialChildNodes = null;
  _initialized = false;
  props = {};

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._initialized || oldValue === newValue) {
      return;
    }

    const propName = attrToPropName(name);
    const value = this.castToPropType(propName, newValue);

    if (this.props[propName] !== value) {
      this.updateProp(attrToPropName(name), newValue);
    }
  }

  connectedCallback() {
    this._initialChildNodes = [...this.childNodes];
    this.initializeProps();
    this._initialized = true;
    this.connected({ ...this, ...this.props });
    this.updateDom();
  }

  disconnectedCallback() {
    this.disconnected({ ...this, ...this.props });
  }

  castToPropType(propName, value) {
    const types = {
      boolean: Boolean,
      number: Number,
      string: String
    };
    const type = types[typeof this.props[propName]];

    return type ? type(value) : value;
  }

  connected() {}

  disconnected() {}

  initializeProps() {
    // Initialize props
    for (const [key, value] of Object.entries(this)) {
      if (
        !IGNORED_PROPS.includes(key) &&
        !key.startsWith('_') &&
        Object.hasOwnProperty.call(this, key) &&
        typeof value !== 'function'
      ) {
        this.props[key] = value;
        const functionSuffix = key.replace(/^(\w)/, match => match.toUpperCase());
        this[`get${functionSuffix}`] = () => this.props[key];
        this[`set${functionSuffix}`] = newValue => this.updateProp(key, newValue);
      }
    }

    // Update props with attributes, if any
    if (this.hasAttributes()) {
      for (let i = 0; i < this.attributes.length; i++) {
        const { name, value } = this.attributes[i];
        const propName = attrToPropName(name);

        this.props[propName] = this.castToPropType(propName, value);
      }
    }

    // Reflect props to attributes
    for (const [key, value] of Object.entries(this.props)) {
      const attrName = propToAttrName(key);

      if (!this.hasAttribute(attrName)) {
        this.updateAttribute(attrName, value);
      }
    }
  }

  updateAttribute(name, value) {
    if (typeof value === 'boolean') {
      if (value) {
        this.setAttribute(name, '');
      } else {
        this.removeAttribute(name);
      }
    } else {
      this.setAttribute(name, value);
    }
  }

  updateDom() {
    render(this, this.render({ ...this, ...this.props, children: this._initialChildNodes }));
  }

  updateProp = (propName, value) => {
    if (value === this.props[propName]) {
      return;
    }

    const newValue = this.castToPropType(propName, value);
    const attrName = propToAttrName(propName);

    this.props[propName] = newValue;
    this.updateAttribute(attrName, newValue);
    this.updateDom();
  };
}

export function define(componentName, componentClass) {
  customElements.define(componentName, componentClass);
}
