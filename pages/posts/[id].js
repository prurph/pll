import Link from "next/link";
import { getPostData, getPostIds } from "../../lib/posts";
import Head from "../../components/Head";
import Layout from "../../components/Layout";

// Static generation of pages with dyanmic routes
// To generate page at path called /posts/<id>, there must be a page at
//   /pages/posts/[id].js
// Containing:
//   1. React component to render the page
//   2. `getStaticPaths` returning an array of possible values for id as
//      { params: { id: ... } }
//   3. `getStaticProps` which takes the above params object and returns data
//      for the given id

// Pages of the form [name] are dynamic routes in NextJS. Since this page is
// [id], it expects a getStaticPaths that returns paths as an array of objects
// which have { params: { id: ... } }, a list of possible values for id
export async function getStaticPaths() {
  return {
    paths: getPostIds(),
    fallback: false,
  };
}

// Fetch data for a blog post with a given id
export async function getStaticProps({ params }) {
  const postData = await getPostData(params.id);
  return { props: { postData } };
}

// This component will get those static props!
export default function Post({ postData }) {
  return (
    <Layout>
      <Head>
        <title>{postData.title}</title>
      </Head>
      <Link href="/">
        <a>Home</a>
      </Link>
      <br />
      {postData.title}
      <br />
      {postData.id}
      <br />
      {postData.date}
      <br />
      <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
    </Layout>
  );
}
