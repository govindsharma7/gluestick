export default function isChildPath (parent, child) {
  const parentSplit = parent.split("/");
  const childSplit = child.split("/");
  const parentSplitLength = parentSplit.length;

  if (parentSplitLength > childSplit.length) {
    return false;
  }

  for (let i = 0; i < parentSplitLength; i++) {
    if (parentSplit[0] !== childSplit[0]) {
      return false;
    }
  }

  return true;
}

