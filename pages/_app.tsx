import type { AppProps } from "next/app";
import { ChainId, ThirdwebProvider } from "@thirdweb-dev/react";
import "../styles/globals.css";
import Head from "next/head";
import ThirdwebGuideFooter from "../components/GitHubLink";
import Script from "next/script";
// This is the chainId your dApp will work on.
const activeChainId = ChainId.Rinkeby;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThirdwebProvider desiredChainId={activeChainId}>
      <Head>
        <title>Invisible Gang</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="Gotta catch and tokenize 'em all"
          content="Invisible Gang"
        />
        <meta name="keywords" content="" />
      </Head>
      <Script
        src="//cdn.jsdelivr.net/npm/amplifi.js@0/amplifi.min.js"
        strategy="afterInteractive"
      ></Script>
      <Component {...pageProps} />
      <ThirdwebGuideFooter />
    </ThirdwebProvider>
  );
}

export default MyApp;
