import { useConnection } from "@concordium/react-components";
import type { WalletConnectionProps } from "@concordium/react-components";

export const useWalletConnection = (props: WalletConnectionProps) => {
  const { account } = useConnection(
    props.connectedAccounts,
    props.genesisHashes
  );

  return {
    account: account || null,
  };
};
