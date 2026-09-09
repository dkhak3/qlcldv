import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "../lib/firebaseClient";
import { getPublicProfiles } from "./publicProfileService";

const POST_LIKES = "blog_post_likes";
const BOOKMARKS = "blog_bookmarks";
const COMMENTS = "blog_comments";
const COMMENT_REACTIONS = "blog_comment_reactions";
const COMMENT_EDITS = "blog_comment_edits";

function toIso(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value.toDate) return value.toDate().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function identity(auth) {
  if (!auth?.user?.uid) throw new Error("Phiên đăng nhập đã hết hạn");
  return {
    ownerId: auth.user.uid,
    ownerName: auth.profile?.fullName || auth.profile?.username || "Người dùng QLCL-DV",
    ownerUsername: auth.profile?.username || "",
    ownerRole: auth.role || "user",
  };
}

function postLikeId(postId, userId) {
  return `${postId}_${userId}`;
}

function bookmarkId(postId, userId) {
  return `${postId}_${userId}`;
}

function commentReactionId(commentId, userId) {
  return `${commentId}_${userId}`;
}

export async function getPostInteractions(postId, userId) {
  const [likesSnapshot, bookmarkSnapshot] = await Promise.all([
    getDocs(query(collection(firestore, POST_LIKES), where("postId", "==", postId))),
    userId
      ? getDocs(query(collection(firestore, BOOKMARKS), where("ownerId", "==", userId), where("postId", "==", postId)))
      : Promise.resolve(null),
  ]);
  let profiles = new Map();
  try {
    profiles = await getPublicProfiles(likesSnapshot.docs.map(item => item.data().ownerId));
  } catch {
    // Dùng thông tin đã lưu cùng lượt tim nếu API hồ sơ tạm thời không khả dụng.
  }
  const likes = likesSnapshot.docs.map(item => {
    const data = item.data();
    const profile = profiles.get(data.ownerId);
    return {
      id: item.id,
      ownerId: data.ownerId,
      ownerName: profile?.fullName || data.ownerName || "Người dùng QLCL-DV",
      ownerUsername: data.ownerUsername || "",
      ownerRole: profile?.role || data.ownerRole || "user",
      createdAt: toIso(data.createdAt),
    };
  }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return {
    likeCount: likesSnapshot.size,
    liked: userId ? likesSnapshot.docs.some(item => item.data().ownerId === userId) : false,
    bookmarked: Boolean(bookmarkSnapshot && !bookmarkSnapshot.empty),
    likes,
  };
}

export async function toggleBlogPostLike(post, auth) {
  const user = identity(auth);
  const reference = doc(firestore, POST_LIKES, postLikeId(post.id, user.ownerId));
  const snapshot = await getDoc(reference);
  if (snapshot.exists()) {
    await deleteDoc(reference);
    return false;
  }
  await setDoc(reference, {
    postId: post.id,
    postSlug: post.slug,
    ...user,
    createdAt: serverTimestamp(),
  });
  return true;
}

export async function toggleBlogBookmark(post, auth) {
  const user = identity(auth);
  const reference = doc(firestore, BOOKMARKS, bookmarkId(post.id, user.ownerId));
  const snapshots = await getDocs(query(
    collection(firestore, BOOKMARKS),
    where("ownerId", "==", user.ownerId),
    where("postId", "==", post.id),
  ));
  if (!snapshots.empty) {
    await Promise.all(snapshots.docs.map(item => deleteDoc(item.ref)));
    return false;
  }
  await setDoc(reference, {
    postId: post.id,
    postSlug: post.slug,
    postTitle: post.title,
    postExcerpt: post.excerpt || "",
    postCategory: post.category || "Khác",
    postCoverUrl: post.coverUrl || "",
    ...user,
    createdAt: serverTimestamp(),
  });
  return true;
}

function mapBookmark(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    createdAt: toIso(data.createdAt),
  };
}

export async function getBlogBookmarks(auth) {
  const user = identity(auth);
  let request;
  if (user.ownerRole === "superadmin") request = collection(firestore, BOOKMARKS);
  else if (user.ownerRole === "admin") request = query(collection(firestore, BOOKMARKS), where("ownerRole", "in", ["user", "admin"]));
  else request = query(collection(firestore, BOOKMARKS), where("ownerId", "==", user.ownerId));
  const snapshots = await getDocs(request);
  return snapshots.docs.map(mapBookmark).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export async function deleteBlogBookmark(id) {
  await deleteDoc(doc(firestore, BOOKMARKS, id));
}

function profileValue(profiles, id, fallbackName, fallbackRole) {
  const profile = profiles.get(id);
  return {
    name: profile?.fullName || fallbackName || "Người dùng QLCL-DV",
    role: profile?.role || fallbackRole || "user",
  };
}

function mapComment(snapshot, reactions, edits, currentUserId, profiles) {
  const data = snapshot.data();
  const owner = profileValue(profiles, data.ownerId, data.ownerName, data.ownerRole);
  const replyTarget = profileValue(profiles, data.replyToId, data.replyToName, data.replyToRole);
  const commentReactions = reactions.filter(item => item.commentId === snapshot.id);
  const reactionCounts = commentReactions.reduce((counts, item) => ({
    ...counts,
    [item.reaction]: (counts[item.reaction] || 0) + 1,
  }), {});
  const reactionPeople = commentReactions.reduce((people, item) => {
    const current = people[item.reaction] || [];
    const reactionOwner = profileValue(profiles, item.ownerId, item.ownerName, item.ownerRole);
    return {
      ...people,
      [item.reaction]: [...current, {
        id: item.id,
        ownerId: item.ownerId,
        ownerName: reactionOwner.name,
        ownerUsername: item.ownerUsername || "",
        ownerRole: reactionOwner.role,
        createdAt: toIso(item.createdAt),
      }],
    };
  }, {});
  const editHistory = edits
    .filter(item => item.commentId === snapshot.id)
    .map(item => {
      const editor = profileValue(profiles, item.editorId, item.editorName, item.editorRole);
      return {
        id: item.id,
        beforeContent: item.beforeContent || "",
        afterContent: item.afterContent || "",
        editorId: item.editorId,
        editorName: editor.name,
        editorRole: editor.role,
        editedAt: toIso(item.editedAt),
      };
    })
    .sort((a, b) => new Date(a.editedAt || 0) - new Date(b.editedAt || 0));
  return {
    id: snapshot.id,
    postId: data.postId,
    parentId: data.parentId || "",
    replyToId: data.replyToId || "",
    replyToName: data.replyToId ? replyTarget.name : (data.replyToName || ""),
    replyToRole: data.replyToId ? replyTarget.role : (data.replyToRole || ""),
    replyToContent: data.replyToContent || "",
    ownerId: data.ownerId,
    ownerName: owner.name,
    ownerUsername: data.ownerUsername || "",
    ownerRole: owner.role,
    content: data.content || "",
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    reactionCounts,
    reactionPeople,
    reactionTotal: commentReactions.length,
    userReaction: commentReactions.find(item => item.ownerId === currentUserId)?.reaction || "",
    editHistory,
  };
}

export async function getBlogComments(postId, currentUserId) {
  const [commentsSnapshot, reactionsSnapshot, editsSnapshot] = await Promise.all([
    getDocs(query(collection(firestore, COMMENTS), where("postId", "==", postId))),
    getDocs(query(collection(firestore, COMMENT_REACTIONS), where("postId", "==", postId))),
    getDocs(query(collection(firestore, COMMENT_EDITS), where("postId", "==", postId))),
  ]);
  const reactions = reactionsSnapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  const edits = editsSnapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  const profileIds = [
    ...commentsSnapshot.docs.flatMap(item => [item.data().ownerId, item.data().replyToId]),
    ...reactions.map(item => item.ownerId),
    ...edits.map(item => item.editorId),
  ].filter(Boolean);
  let profiles = new Map();
  try {
    profiles = await getPublicProfiles(profileIds);
  } catch {
    // Bình luận vẫn hiển thị bằng dữ liệu dự phòng nếu API hồ sơ tạm thời lỗi.
  }
  return commentsSnapshot.docs
    .map(item => mapComment(item, reactions, edits, currentUserId, profiles))
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
}

export async function createBlogComment({ postId, content, parentId = "", replyToId = "", replyToName = "", replyToRole = "", replyToContent = "" }, auth) {
  const cleanContent = String(content || "").trim();
  const cleanReplyContent = String(replyToContent || "").trim().slice(0, 500);
  if (!cleanContent) throw new Error("Vui lòng nhập nội dung bình luận");
  if (cleanContent.length > 1200) throw new Error("Bình luận không được dài quá 1.200 ký tự");
  const user = identity(auth);
  const reference = await addDoc(collection(firestore, COMMENTS), {
    postId,
    parentId,
    replyToId,
    replyToName,
    replyToRole,
    replyToContent: cleanReplyContent,
    content: cleanContent,
    ...user,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const now = new Date().toISOString();
  return { id: reference.id, postId, parentId, replyToId, replyToName, replyToRole, replyToContent: cleanReplyContent, content: cleanContent, ...user, createdAt: now, updatedAt: now, reactionCounts: {}, reactionPeople: {}, reactionTotal: 0, userReaction: "", editHistory: [] };
}

export async function updateBlogComment(id, content, auth) {
  const cleanContent = String(content || "").trim();
  if (!cleanContent) throw new Error("Bình luận không được để trống");
  if (cleanContent.length > 1200) throw new Error("Bình luận không được dài quá 1.200 ký tự");
  const commentReference = doc(firestore, COMMENTS, id);
  const snapshot = await getDoc(commentReference);
  if (!snapshot.exists()) throw new Error("Bình luận không còn tồn tại");
  const previous = snapshot.data();
  if (String(previous.content || "").trim() === cleanContent) throw new Error("Nội dung bình luận chưa thay đổi");
  const editor = identity(auth);
  const historyReference = doc(collection(firestore, COMMENT_EDITS));
  const batch = writeBatch(firestore);
  batch.set(historyReference, {
    commentId: id,
    postId: previous.postId,
    commentOwnerId: previous.ownerId,
    commentOwnerRole: previous.ownerRole || "user",
    beforeContent: previous.content || "",
    afterContent: cleanContent,
    editorId: editor.ownerId,
    editorName: editor.ownerName,
    editorUsername: editor.ownerUsername,
    editorRole: editor.ownerRole,
    editedAt: serverTimestamp(),
  });
  batch.update(commentReference, {
    content: cleanContent,
    updatedAt: serverTimestamp(),
    lastEditId: historyReference.id,
  });
  await batch.commit();
  return cleanContent;
}

export async function deleteBlogComment(id) {
  await deleteDoc(doc(firestore, COMMENTS, id));
}

export async function setBlogCommentReaction({ postId, commentId, reaction }, auth) {
  const user = identity(auth);
  const reference = doc(firestore, COMMENT_REACTIONS, commentReactionId(commentId, user.ownerId));
  const snapshot = await getDoc(reference);
  if (snapshot.exists() && snapshot.data().reaction === reaction) {
    await deleteDoc(reference);
    return "";
  }
  await setDoc(reference, {
    postId,
    commentId,
    reaction,
    ...user,
    createdAt: snapshot.exists() ? snapshot.data().createdAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return reaction;
}
