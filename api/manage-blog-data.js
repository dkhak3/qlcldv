import { adminDb, onlyPost, parseBody, requireRole, sendApiError } from "./_firebaseAdmin.js";
import { collectCommentTreeIds, findOrphanCommentIds } from "./_blogCommentTree.js";

const COLLECTIONS_BY_POST = [
  "blog_post_likes",
  "blog_bookmarks",
  "blog_comments",
  "blog_comment_reactions",
  "blog_comment_edits",
];

function canDeleteComment(caller, comment) {
  const ownerRole = comment.ownerRole || "user";
  return comment.ownerId === caller.uid
    || (caller.role === "admin" && ownerRole === "user")
    || (caller.role === "superadmin" && ["user", "admin"].includes(ownerRole));
}

async function commitDeletes(references) {
  const unique = [...new Map(references.map(reference => [reference.path, reference])).values()];
  for (let index = 0; index < unique.length; index += 400) {
    const batch = adminDb.batch();
    unique.slice(index, index + 400).forEach(reference => batch.delete(reference));
    await batch.commit();
  }
  return unique.length;
}

async function deletePost(postId) {
  const postReference = adminDb.collection("blog_posts").doc(postId);
  const postSnapshot = await postReference.get();
  if (!postSnapshot.exists) throw Object.assign(new Error("Bài viết không còn tồn tại"), { status: 404 });

  const snapshots = await Promise.all(COLLECTIONS_BY_POST.map(name => (
    adminDb.collection(name).where("postId", "==", postId).get()
  )));
  const references = [postReference, ...snapshots.flatMap(snapshot => snapshot.docs.map(item => item.ref))];
  const deleted = await commitDeletes(references);
  return { deleted, postId };
}

async function deleteComment(commentId, caller) {
  const commentReference = adminDb.collection("blog_comments").doc(commentId);
  const commentSnapshot = await commentReference.get();
  if (!commentSnapshot.exists) throw Object.assign(new Error("Bình luận không còn tồn tại"), { status: 404 });
  const comment = commentSnapshot.data();
  if (!canDeleteComment(caller, comment)) {
    throw Object.assign(new Error("Bạn không có quyền xóa bình luận này"), { status: 403 });
  }

  const postId = String(comment.postId || "");
  const commentsSnapshot = postId
    ? await adminDb.collection("blog_comments").where("postId", "==", postId).get()
    : null;

  const comments = commentsSnapshot
    ? commentsSnapshot.docs.map(item => ({ id: item.id, ...item.data(), ref: item.ref }))
    : [{ id: commentId, ...comment, ref: commentReference }];

  const treeIds = new Set(collectCommentTreeIds(comments, commentId));
  if (!treeIds.size) treeIds.add(commentId);

  const [reactions, edits] = postId
    ? await Promise.all([
        adminDb.collection("blog_comment_reactions").where("postId", "==", postId).get(),
        adminDb.collection("blog_comment_edits").where("postId", "==", postId).get(),
      ])
    : await Promise.all([
        adminDb.collection("blog_comment_reactions").where("commentId", "==", commentId).get(),
        adminDb.collection("blog_comment_edits").where("commentId", "==", commentId).get(),
      ]);

  const commentReferences = comments
    .filter(item => treeIds.has(item.id))
    .map(item => item.ref || adminDb.collection("blog_comments").doc(item.id));

  const reactionReferences = reactions.docs
    .filter(item => treeIds.has(String(item.data().commentId || "")))
    .map(item => item.ref);

  const editReferences = edits.docs
    .filter(item => treeIds.has(String(item.data().commentId || "")))
    .map(item => item.ref);

  const deleted = await commitDeletes([
    ...commentReferences,
    ...reactionReferences,
    ...editReferences,
  ]);

  return {
    deleted,
    commentId,
    deletedComments: commentReferences.length,
    deletedReplies: Math.max(0, commentReferences.length - 1),
    deletedReactions: reactionReferences.length,
    deletedEdits: editReferences.length,
  };
}

async function cleanupOrphans() {
  const [posts, comments, likes, bookmarks, reactions, edits] = await Promise.all([
    adminDb.collection("blog_posts").get(),
    adminDb.collection("blog_comments").get(),
    adminDb.collection("blog_post_likes").get(),
    adminDb.collection("blog_bookmarks").get(),
    adminDb.collection("blog_comment_reactions").get(),
    adminDb.collection("blog_comment_edits").get(),
  ]);
  const postIds = new Set(posts.docs.map(item => item.id));
  const commentItems = comments.docs.map(item => ({ id: item.id, ...item.data(), ref: item.ref }));
  const orphanCommentIds = new Set(findOrphanCommentIds(commentItems, postIds));
  const validCommentIds = new Set(commentItems.filter(item => !orphanCommentIds.has(item.id)).map(item => item.id));
  const references = [
    ...commentItems.filter(item => orphanCommentIds.has(item.id)).map(item => item.ref),
    ...likes.docs.filter(item => !postIds.has(item.data().postId)).map(item => item.ref),
    ...bookmarks.docs.filter(item => !postIds.has(item.data().postId)).map(item => item.ref),
    ...reactions.docs.filter(item => !postIds.has(item.data().postId) || !validCommentIds.has(item.data().commentId)).map(item => item.ref),
    ...edits.docs.filter(item => !postIds.has(item.data().postId) || !validCommentIds.has(item.data().commentId)).map(item => item.ref),
  ];
  return {
    deleted: await commitDeletes(references),
    orphanComments: orphanCommentIds.size,
  };
}

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return;
  try {
    const { action, payload = {} } = parseBody(req);
    if (action === "delete-post") {
      await requireRole(req, ["admin", "superadmin"]);
      if (!payload.id) throw new Error("Thiếu mã bài viết cần xóa");
      return res.status(200).json({ ok: true, ...(await deletePost(String(payload.id))) });
    }
    if (action === "delete-comment") {
      const caller = await requireRole(req, ["user", "admin", "superadmin"]);
      if (!payload.id) throw new Error("Thiếu mã bình luận cần xóa");
      return res.status(200).json({ ok: true, ...(await deleteComment(String(payload.id), caller)) });
    }
    if (action === "cleanup-orphans") {
      await requireRole(req, ["admin", "superadmin"]);
      return res.status(200).json({ ok: true, ...(await cleanupOrphans()) });
    }
    throw Object.assign(new Error("Thao tác Blog không hợp lệ"), { status: 400 });
  } catch (error) {
    return sendApiError(res, error);
  }
}
