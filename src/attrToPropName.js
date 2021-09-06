export default function attrToPropName(attrName) {
  return attrName.replace(/(-\w)/gi, match => match[1].toUpperCase());
}
