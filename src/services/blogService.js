import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { authenticatedApi } from "../lib/authenticatedApi";
import { firestore } from "../lib/firebaseClient";
import { fileToBase64 } from "../utils/media";

function toIso(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value.toDate) return value.toDate().toISOString();
  return new Date(value).toISOString();
}

export function mapBlogPost(snapshot) {
  const row = snapshot.data();
  return {
    id: snapshot.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || "",
    category: row.category || "Khác",
    tags: Array.isArray(row.tags) ? row.tags : [],
    author: row.author || "QLCL-DV",
    authorId: row.createdBy || null,
    status: row.status || "draft",
    featured: Boolean(row.featured),
    coverUrl: row.coverUrl || "",
    videoUrl: row.videoUrl || "",
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    publishedAt: toIso(row.publishedAt),
    readTime: Number(row.readTime) || 1,
    views: Number(row.views) || 0,
    content: row.content || "",
  };
}

function toDatabasePost(post, userId, creating = false) {
  const now = new Date().toISOString();
  return {
    title: post.title.trim(),
    slug: post.slug,
    excerpt: post.excerpt.trim(),
    content: post.content.trim(),
    category: post.category,
    tags: post.tags,
    author: post.author.trim() || "QLCL-DV",
    status: post.status,
    featured: Boolean(post.featured),
    coverUrl: post.coverUrl || "",
    videoUrl: post.videoUrl || "",
    readTime: Number(post.readTime) || 1,
    publishedAt: post.status === "published" ? (post.publishedAt || now) : null,
    updatedAt: serverTimestamp(),
    ...(creating ? { createdAt: serverTimestamp(), createdBy: userId, views: 0 } : {}),
  };
}

function sortPosts(posts) {
  return posts.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
}

export async function getPublicBlogPosts() {
  const snapshots = await getDocs(query(collection(firestore, "blog_posts"), where("status", "==", "published")));
  return sortPosts(snapshots.docs.map(mapBlogPost));
}

export async function getAllBlogPosts() {
  const snapshots = await getDocs(collection(firestore, "blog_posts"));
  return sortPosts(snapshots.docs.map(mapBlogPost));
}

export async function getBlogPostBySlug(slug, canManage = false) {
  const conditions = [where("slug", "==", slug)];
  if (!canManage) conditions.push(where("status", "==", "published"));
  const snapshots = await getDocs(query(collection(firestore, "blog_posts"), ...conditions));
  return snapshots.empty ? null : mapBlogPost(snapshots.docs[0]);
}

export async function createBlogPost(post, userId) {
  const reference = await addDoc(collection(firestore, "blog_posts"), toDatabasePost(post, userId, true));
  const now = new Date().toISOString();
  return { ...post, id: reference.id, authorId: userId, createdAt: now, updatedAt: now, publishedAt: post.status === "published" ? (post.publishedAt || now) : "", views: 0 };
}

export async function updateBlogPostRecord(post) {
  await updateDoc(doc(firestore, "blog_posts", post.id), toDatabasePost(post));
  return { ...post, updatedAt: new Date().toISOString() };
}

export async function deleteBlogPostRecord(id) {
  await deleteDoc(doc(firestore, "blog_posts", id));
}

export async function uploadBlogImage(file) {
  if (!file?.type?.startsWith("image/")) throw new Error("Chỉ chấp nhận file hình ảnh");
  if (file.size > 3 * 1024 * 1024) throw new Error("Ảnh không được lớn hơn 3 MB");
  const image = await fileToBase64(file);
  const result = await authenticatedApi("/api/upload-image", {
    image,
    mimeType: file.type,
    name: file.name,
  });
  return result.url;
}

export async function incrementBlogViews(id) {
  if (!id) return;
  await updateDoc(doc(firestore, "blog_posts", id), { views: increment(1) });
}
