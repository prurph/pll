import fs from "fs";
import path from "path";
import matter from "gray-matter";
import _sortBy from "lodash/sortBy";

const postsDirectory = path.join(process.cwd(), "posts");

export function getSortedPosts() {
  const fileNames = fs.readdirSync(postsDirectory);
  const postsData = fileNames.map((fileName) => {
    const id = fileName.replace(/\.md$/, "");

    const filePath = path.join(postsDirectory, fileName);
    const contents = fs.readFileSync(filePath, "utf8");
    const metadata = matter(contents);

    return {
      id,
      ...metadata.data,
    };
  });

  return _sortBy(postsData, ["date", "title"]);
}
