export default function isChildPath (parent, child) {
  if (parent === "/") {
    return true;
  }

  const parentSplit = parent.split("/");
  const childSplit = child.split("/");
  const parentSplitLength = parentSplit.length;

  if (parentSplitLength > childSplit.length) {
    return false;
  }

  for (let i = 0; i < parentSplitLength; i++) {
    if (parentSplit[i] !== childSplit[i]) {
      return false;
    }
  }

  return true;
}

