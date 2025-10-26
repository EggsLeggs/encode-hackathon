import React, { useEffect } from 'react';
import { Shield, Wallet } from 'lucide-react';
import { Button } from './ui/button';
import {
    useConnect,
    BrowserWalletConnector,
    persistentConnectorType,
} from '@concordium/react-components';
import type { WalletConnectionProps } from '@concordium/react-components';
import { useWalletConnection } from '../lib/wallet';

const BROWSER_WALLET = persistentConnectorType(BrowserWalletConnector.create);

export const WalletButton: React.FC<WalletConnectionProps> = (props) => {
    const {
        activeConnectorType,
        setActiveConnectorType,
        activeConnector,
        activeConnectorError,
    } = props;
    const { account, setConnection } = useWalletConnection(props);
    const { connect, isConnecting, connectError } = useConnect(activeConnector, setConnection);
    

    // Auto-connect when wallet type is selected
    useEffect(() => {
        if (activeConnector && !account && !isConnecting) {
            connect();
        }
    }, [activeConnector, account, isConnecting, connect]);

    const truncateAddress = (addr: string) => {
        if (addr.length <= 10) return addr;
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    // If wallet is connected and we have an account, show connected state
    if (account && activeConnectorType === BROWSER_WALLET) {
        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-md">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">
                        {truncateAddress(account)}
                    </span>
                </div>
                
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveConnectorType(undefined)}
                >
                    Disconnect
                </Button>
            </div>
        );
    }

    // Handle immediate connection
    const handleWalletConnect = async () => {
        if (activeConnectorType === BROWSER_WALLET) {
            // If already selected, disconnect
            setActiveConnectorType(undefined);
        } else {
            // Select wallet type and immediately connect
            setActiveConnectorType(BROWSER_WALLET);
            // The useEffect in the parent will handle the connection
        }
    };

    // Show connection button and status
    return (
        <div className="flex flex-col gap-2">
            <Button
                variant={activeConnectorType === BROWSER_WALLET ? 'default' : 'outline'}
                onClick={handleWalletConnect}
                disabled={isConnecting}
                className="flex items-center gap-2"
            >
                <Wallet className="w-4 h-4" />
                <span>
                    {isConnecting ? 'Connecting...' : 
                     activeConnectorType === BROWSER_WALLET ? 'Disconnect Wallet' : 
                     'Use Browser Wallet'}
                </span>
            </Button>
            
            {/* Show connection status and errors */}
            {activeConnectorError && (
                <div className="text-red-500 text-xs">
                    Connector error: {activeConnectorError}
                </div>
            )}
            {connectError && (
                <div className="text-red-500 text-xs">
                    Connect error: {connectError}
                </div>
            )}
        </div>
    );
};