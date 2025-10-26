import { useConnection } from "@concordium/react-components";
import type { WalletConnectionProps } from "@concordium/react-components";
import { useEffect } from "react";

export const useWalletConnection = (props: WalletConnectionProps) => {
  const { connection, setConnection, account } = useConnection(
    props.connectedAccounts,
    props.genesisHashes
  );

  // Auto-select connection when activeConnector changes
  useEffect(() => {
    if (props.activeConnector) {
      // When changing connector, select the first of any existing connections.
      const connections = props.activeConnector.getConnections();
      if (connections.length) {
        setConnection(connections[0]);
      }
    }
    return () => setConnection(undefined);
  }, [props.activeConnector, setConnection]);

  // Also check for existing connections when connectedAccounts changes
  useEffect(() => {
    if (
      props.connectedAccounts.size > 0 &&
      props.activeConnector &&
      !connection
    ) {
      const connections = props.activeConnector.getConnections();
      if (connections.length) {
        setConnection(connections[0]);
      }
    }
  }, [
    props.connectedAccounts,
    props.activeConnector,
    connection,
    setConnection,
  ]);

  // Force re-render when connection state changes
  useEffect(() => {
    // This effect will trigger re-renders when the connection changes
  }, [connection, account]);

  return {
    account: account || null,
    connection: connection || null,
    setConnection,
  };
};
