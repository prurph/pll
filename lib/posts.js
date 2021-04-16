import fs from "fs";
import html from "remark-html";
import path from "path";
import prism from "remark-prism";
import matter from "gray-matter";
import remark from "remark";
import _sortBy from "lodash/sortBy";

const postsDirectory = path.join(process.cwd(), "posts");

export async function getSortedPosts() {
  const fileNames = fs.readdirSync(postsDirectory);
  const postsData = await Promise.all(
    fileNames.map(
      async (fileName) => await getPostData(postIdFromFileName(fileName))
    )
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

export async function getPostData(id) {
  return postDataFromFileName(`${id}.md`);
}

function postIdFromFileName(fileName) {
  return fileName.replace(/\.md$/, "");
}

// TODO: this is the wrong abstraction because getSortedPosts is processing
// the markdown via this function when it has no reason to.
async function postDataFromFileName(fileName) {
  const filePath = path.join(postsDirectory, fileName);
  const contents = fs.readFileSync(filePath, "utf8");
  const parsed = matter(contents);
  const processed = await remark()
    .use(prism, { transformInlineCode: true })
    .use(html)
    .process(parsed.content);

  return {
    id: postIdFromFileName(fileName),
    contentHtml: processed.toString(),
    ...parsed.data,
  };
}
