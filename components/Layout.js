import { Container } from "theme-ui";

export default function Layout({ children }) {
  return (
    <Container p={4}>
      {children}
      <style jsx global>{`
        :not(pre) > code {
          background-color: #2e3440;
          color: var(--theme-ui-colors-background);
          font-family: "Fira Code", Monaco, "Ubuntu Mono", monospace;
          padding: 0.1em;
          margin: 0 0.1em;
          border-radius: 0.2em;
          white-space: normal;
          font-size: 90%;
        }
      `}</style>
    </Container>
  );
}
