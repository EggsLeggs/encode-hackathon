import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import type { WalletConnectionProps } from '@concordium/react-components';
import { Layout } from './components/Layout';
import { RegisterExam } from './pages/RegisterExam';
import { TakeExam } from './pages/TakeExam';
import { BecomeProctor, ProctorProvider } from './pages/BecomeProctor';
import { ProctorExam } from './pages/ProctorExam';

function App(props: WalletConnectionProps) {
  return (
    <ProctorProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout {...props} />}>
            <Route path="/register" element={<RegisterExam {...props} />} />
            <Route path="/exam" element={<TakeExam {...props} />} />
            <Route path="/become-proctor" element={<BecomeProctor {...props} />} />
            <Route path="/proctor" element={<ProctorExam {...props} />} />
            <Route index element={<RegisterExam {...props} />} />
          </Route>
        </Routes>
      </Router>
    </ProctorProvider>
  );
}

export default App;
