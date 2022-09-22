import {
  ChainId,
  useClaimedNFTSupply,
  useContractMetadata,
  useNetwork,
  useNFTDrop,
  useUnclaimedNFTSupply,
  useActiveClaimCondition,
  useWalletConnect,
  useCoinbaseWallet,
} from "@thirdweb-dev/react";
import { useNetworkMismatch } from "@thirdweb-dev/react";
import { useAddress, useMetamask, Web3Button } from "@thirdweb-dev/react";
import { useSession } from "next-auth/react";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import type { NextPage } from "next";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import SignIn from "../components/SignIn";
import styles from "../styles/Theme.module.css";

const myNftDropContractAddress = "0x24F813e7c092afEe84463dA42cf3d213dA21E57A";

const Home: NextPage = () => {
  const nftDrop = useNFTDrop(myNftDropContractAddress);
  const address = useAddress();
  // Get the currently authenticated user's session (next auth + discord)
  const { data: session } = useSession();
  const connectWithMetamask = useMetamask();
  const connectWithWalletConnect = useWalletConnect();
  const connectWithCoinbaseWallet = useCoinbaseWallet();
  const isOnWrongNetwork = useNetworkMismatch();
  const [, switchNetwork] = useNetwork();
  const [isMintingLoading, setIsMintingLoading] = useState(false);

  // check to show eligiblity for minting on the UI
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (session) {
      setIsLoading(true);
      fetch("api/check-is-in-server")
        .then((res) => res.json())
        .then((res) => {
          setData(res || undefined);
          setIsLoading(false);
        });
    }
  }, [session]);

  // The amount the user claims
  const [quantity, setQuantity] = useState(1); // default to 1

  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const { current } = videoRef;
    const handleMouseOverVideo = () => {
      if (current) {
        current.play();
      }
    };
    document.addEventListener("click", handleMouseOverVideo);
    return () => {
      document.removeEventListener("click", handleMouseOverVideo);
    };
  });

  // Load contract metadata
  const { data: contractMetadata } = useContractMetadata(
    myNftDropContractAddress
  );

  // Load claimed supply and unclaimed supply
  const { data: unclaimedSupply } = useUnclaimedNFTSupply(nftDrop);
  const { data: claimedSupply } = useClaimedNFTSupply(nftDrop);

  // Load the active claim condition
  const { data: activeClaimCondition } = useActiveClaimCondition(nftDrop);

  // Check if there's NFTs left on the active claim phase
  const isNotReady =
    activeClaimCondition &&
    parseInt(activeClaimCondition?.availableSupply) === 0;

  // Check if there's any NFTs left
  const isSoldOut = unclaimedSupply?.toNumber() === 0;

  // Check price
  const price = parseUnits(
    activeClaimCondition?.currencyMetadata.displayValue || "0",
    activeClaimCondition?.currencyMetadata.decimals
  );

  // Multiply depending on quantity
  const priceToMint = price.mul(quantity);

  // Loading state while we fetch the metadata
  if (!nftDrop || !contractMetadata) {
    return <div className={styles.container}>Loading...</div>;
  }

  const mintNft = async () => {
    setIsMintingLoading(true);

    if (isOnWrongNetwork) {
      switchNetwork && switchNetwork(ChainId.Mainnet);
      return;
    }

    const signature = await fetch("/api/generate-signature", {
      method: "POST",
      body: JSON.stringify({
        claimerAddress: address,
        quantity: quantity,
      }),
    });

    if (signature.status === 200) {
      const json = await signature.json();
      const signedPayload = json.signedPayload;

      try {
        const nft = await nftDrop.signature!.mint(signedPayload);
        if (nft.id) {
          alert(`Successfully minted NFT${quantity > 1 ? "s" : ""}!`);
        }
      } catch (e) {
        console.error("Got no nftDrop contract");
      }

      // claimNFT.mutate(
      //   { to: address as string, quantity },
      //   {
      //     onSuccess: () => {
      //       alert(`Successfully minted NFT${quantity > 1 ? "s" : ""}!`);
      //     },
      //     onError: (err: any) => {
      //       console.error(err);
      //       alert(err?.message || "Something went wrong");
      //     },
      //   }
      // );
    } else if (signature.status === 500) {
      const json = await signature.json();
      alert(json);
    }
    setIsMintingLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.mintInfoContainer}>
        <div className={styles.infoSide}>
          {/* Title of your NFT Collection */}
          <h1>{contractMetadata?.name}</h1>
          {/* Description of your NFT Collection */}
          <p className={styles.description}>{contractMetadata?.description}</p>
          <video height='250px' ref={videoRef}>
            <source src='/gangTrap.webm' type='video/webm' />
          </video>
        </div>

        <div className={styles.imageSide}>
          {/* Image Preview of NFTs */}
          <Image
            className={styles.image}
            src={contractMetadata?.image}
            alt={`${contractMetadata?.name} preview image`}
            width='250px'
            height='250px'
          />

          {/* Amount claimed so far */}
          <div className={styles.mintCompletionArea}>
            <div className={styles.mintAreaLeft}>
              <p>Total Minted</p>
            </div>
            <div className={styles.mintAreaRight}>
              {claimedSupply && unclaimedSupply ? (
                <p>
                  {/* Claimed supply so far */}
                  <b>{claimedSupply?.toNumber()}</b>
                  {" / "}
                  {
                    // Add unclaimed and claimed supply to get the total supply
                    claimedSupply?.toNumber() + unclaimedSupply?.toNumber()
                  }
                </p>
              ) : (
                // Show loading state if we're still loading the supply
                <p>Loading....</p>
              )}
            </div>
          </div>
          <SignIn />
          {/* Show claim button or connect wallet button */}
          {address ? (
            // Sold out or show the claim button
            isSoldOut ? (
              <div>
                <h2>ALL are trapped. In this dimension.</h2>
              </div>
            ) : isNotReady ? (
              <div>
                <h2>Trap is not set yet.</h2>
              </div>
            ) : (
              <>
                <p>Quantity</p>
                <div className={styles.quantityContainer}>
                  <button
                    className={`${styles.quantityControlButton}`}
                    onClick={() => setQuantity(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>

                  <h4>{quantity}</h4>

                  <button
                    className={`${styles.quantityControlButton}`}
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={
                      quantity >=
                      parseInt(
                        activeClaimCondition?.quantityLimitPerTransaction || "0"
                      )
                    }
                  >
                    +
                  </button>
                </div>

                {address && session ? (
                  isLoading ? (
                    <p>Checking...</p>
                  ) : data ? (
                    <Web3Button
                      contractAddress={myNftDropContractAddress}
                      action={() => mintNft()}
                      colorMode='dark'
                      accentColor='#F213A4'
                    >
                      {isMintingLoading
                        ? "Minting..."
                        : `Trap & Tokenize${
                            quantity > 1 ? ` ${quantity}` : ""
                          }${
                            activeClaimCondition?.price.eq(0)
                              ? " (Free)"
                              : activeClaimCondition?.currencyMetadata
                                  .displayValue
                              ? ` (${formatUnits(
                                  priceToMint,
                                  activeClaimCondition.currencyMetadata.decimals
                                )} ${
                                  activeClaimCondition?.currencyMetadata.symbol
                                })`
                              : ""
                          }`}
                    </Web3Button>
                  ) : (
                    <div className={`${styles.main} ${styles.spacerTop}`}>
                      <p>
                        Looks like you are not a part of the Discord server.
                      </p>
                      <a
                        className={styles.mainButton}
                        href={`https://discord.gg/uAXpn3ph`}
                      >
                        Join Server
                      </a>
                    </div>
                  )
                ) : null}
              </>
            )
          ) : (
            <div className={styles.buttons}>
              <button
                className={styles.mainButton}
                onClick={connectWithMetamask}
              >
                Connect MetaMask
              </button>
              <button
                className={styles.mainButton}
                onClick={connectWithWalletConnect}
              >
                Connect with Wallet Connect
              </button>
              <button
                className={styles.mainButton}
                onClick={connectWithCoinbaseWallet}
              >
                Connect with Coinbase Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
