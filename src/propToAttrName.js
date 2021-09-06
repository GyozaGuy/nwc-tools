export default function propToAttrName(propName) {
  return propName.replace(/([A-Z])[a-z]/g, match => `-${match.toLowerCase()}`);
}
