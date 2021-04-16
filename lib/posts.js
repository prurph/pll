import fs from "fs";
import path from "path";
import matter from "gray-matter";
import _sortBy from "lodash/sortBy";

const postsDirectory = path.join(process.cwd(), "posts");

export function getSortedPosts() {
  const fileNames = fs.readdirSync(postsDirectory);
  const postsData = fileNames.map((fileName) =>
    getPostData(postIdFromFileName(fileName))
  );

  return _sortBy(postsData, ["date", "title"]);
}

// Each object is formatted with { params: { ... } } as expected by
// getStaticPaths
export function getPostIds() {
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames.map((fileName) => {
    return {
      params: {
        id: postIdFromFileName(fileName),
      },
    };
  });
}

export function getPostData(id) {
  return postDataFromFileName(`${id}.md`);
}

function postIdFromFileName(fileName) {
  return fileName.replace(/\.md$/, "");
}

function postDataFromFileName(fileName) {
  const filePath = path.join(postsDirectory, fileName);
  const contents = fs.readFileSync(filePath, "utf8");
  const metadata = matter(contents);

  return {
    id: postIdFromFileName(fileName),
    ...metadata.data,
  };
}
