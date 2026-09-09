import { Link } from "react-router-dom";

export default function BlogAuthorLink({ post, className = "", children }) {
  const content = children || post?.author || "QLCL-DV";
  if (!post?.authorId || post?.authorRole === "user") return <span className={className}>{content}</span>;
  return <Link className={`${className} transition hover:text-brand-600 dark:hover:text-orange-300`} to={`/tac-gia/${post.authorId}`} title={`Xem bài viết của ${post.author}`}>{content}</Link>;
}
