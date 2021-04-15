import Document, { Html, Head, Main, NextScript } from "next/document";
import { InitializeColorMode } from "theme-ui";

export default class extends Document {
  static async getInitialProps(ctx) {
    return { ...(await Document.getInitialProps(ctx)) };
  }

  // Adding InitializeColorMode prevents color flashes
  render() {
    return (
      <Html lang="en">
        <Head />
        <body>
          <InitializeColorMode />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
