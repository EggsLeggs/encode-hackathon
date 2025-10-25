import { TESTNET, WithWalletConnector } from '@concordium/react-components';
import App from './App';

export default function Root() {
    return <WithWalletConnector network={TESTNET}>{(props) => <App {...props} />}</WithWalletConnector>;
}
