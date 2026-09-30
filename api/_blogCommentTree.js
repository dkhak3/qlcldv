export function collectCommentTreeIds(comments = [], rootId) {
  const byParent = new Map();
  for (const comment of comments) {
    const id = String(comment?.id || "");
    const parentId = String(comment?.parentId || "");
    if (!id) continue;
    if (!byParent.has(parentId)) byParent.set(parentId, []);
    byParent.get(parentId).push(id);
  }

  const ordered = [];
  const seen = new Set();
  const queue = [String(rootId || "")];

  while (queue.length) {
    const id = queue.shift();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
    const children = byParent.get(id) || [];
    for (const childId of children) {
      if (!seen.has(childId)) queue.push(childId);
    }
  }

  return ordered;
}

export function findOrphanCommentIds(comments = [], validPostIds = new Set()) {
  const byId = new Map();
  for (const comment of comments) {
    const id = String(comment?.id || "");
    if (id) byId.set(id, comment);
  }

  const valid = new Set();
  let changed = true;

  while (changed) {
    changed = false;
    for (const [id, comment] of byId.entries()) {
      if (valid.has(id)) continue;
      const postId = String(comment?.postId || "");
      const parentId = String(comment?.parentId || "");

      if (!validPostIds.has(postId)) continue;
      if (!parentId) {
        valid.add(id);
        changed = true;
        continue;
      }

      const parent = byId.get(parentId);
      if (parent && String(parent?.postId || "") === postId && valid.has(parentId)) {
        valid.add(id);
        changed = true;
      }
    }
  }

  return [...byId.keys()].filter(id => !valid.has(id));
}
