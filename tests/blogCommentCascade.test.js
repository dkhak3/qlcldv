import test from "node:test";
import assert from "node:assert/strict";
import { collectCommentTreeIds, findOrphanCommentIds } from "../api/_blogCommentTree.js";

test("xóa bình luận cha thu thập toàn bộ reply con/cháu", () => {
  const comments = [
    { id: "root", parentId: "", postId: "post-1" },
    { id: "reply-1", parentId: "root", postId: "post-1" },
    { id: "reply-2", parentId: "root", postId: "post-1" },
    { id: "nested", parentId: "reply-1", postId: "post-1" },
    { id: "other-root", parentId: "", postId: "post-1" },
    { id: "other-reply", parentId: "other-root", postId: "post-1" },
  ];

  assert.deepEqual(
    collectCommentTreeIds(comments, "root"),
    ["root", "reply-1", "reply-2", "nested"],
  );
});

test("xóa một reply chỉ lấy reply đó và các con của nó", () => {
  const comments = [
    { id: "root", parentId: "", postId: "post-1" },
    { id: "reply-1", parentId: "root", postId: "post-1" },
    { id: "reply-2", parentId: "root", postId: "post-1" },
    { id: "nested", parentId: "reply-1", postId: "post-1" },
  ];

  assert.deepEqual(
    collectCommentTreeIds(comments, "reply-1"),
    ["reply-1", "nested"],
  );
});

test("cascade helper không lặp vô hạn nếu dữ liệu cũ có chu trình", () => {
  const comments = [
    { id: "a", parentId: "c", postId: "post-1" },
    { id: "b", parentId: "a", postId: "post-1" },
    { id: "c", parentId: "b", postId: "post-1" },
  ];

  assert.deepEqual(collectCommentTreeIds(comments, "a"), ["a", "b", "c"]);
});

test("cleanup nhận diện reply mồ côi và toàn bộ nhánh con của nó", () => {
  const postIds = new Set(["post-1"]);
  const comments = [
    { id: "root", parentId: "", postId: "post-1" },
    { id: "valid-reply", parentId: "root", postId: "post-1" },
    { id: "orphan", parentId: "missing-parent", postId: "post-1" },
    { id: "orphan-child", parentId: "orphan", postId: "post-1" },
    { id: "deleted-post-comment", parentId: "", postId: "post-deleted" },
    { id: "wrong-post-parent", parentId: "root", postId: "post-deleted" },
  ];

  assert.deepEqual(
    new Set(findOrphanCommentIds(comments, postIds)),
    new Set(["orphan", "orphan-child", "deleted-post-comment", "wrong-post-parent"]),
  );
});

test("cleanup coi chu trình parentId là dữ liệu mồ côi", () => {
  const postIds = new Set(["post-1"]);
  const comments = [
    { id: "root", parentId: "", postId: "post-1" },
    { id: "a", parentId: "b", postId: "post-1" },
    { id: "b", parentId: "a", postId: "post-1" },
  ];

  assert.deepEqual(
    new Set(findOrphanCommentIds(comments, postIds)),
    new Set(["a", "b"]),
  );
});
