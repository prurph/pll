/** @jsxImportSource theme-ui */
import Link from "next/link";
import Head from "../components/Head";
import { getSortedPosts } from "../lib/posts";

// Static generation with data using `getStaticProps`. Exporting this async
// function along with a page component causes Next.js to run this function
// at build time when generating the static content, and to pass the result
// as props to the component.
// To use server-side rendering (instead of static at build time), define
// `getServerSideProps` instead.
export async function getStaticProps() {
  const sortedPosts = await getSortedPosts();
  return { props: { sortedPosts } };
}

export default function Home({ sortedPosts }) {
  return (
    <div className="container">
      <Head>
        <title>Create Next App</title>
      </Head>

      <main>
        {sortedPosts.map(({ id, date, title }) => (
          <li key={id}>
            {/* POC of sx for themed-ui custom css */}
            <Link href={`/posts/${id}`}>
              <a>{title}</a>
            </Link>
            <p
              sx={{
                color: "secondary",
                backgroundColor: "tomato",
              }}
            >
              {title}
              <br />
              {date}
            </p>
          </li>
        ))}
      </main>
      <style jsx>{`
        li {
          list-style-type: none;
        }
      `}</style>
    </div>
  );
}
