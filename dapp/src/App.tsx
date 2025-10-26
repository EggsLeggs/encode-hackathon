import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import type { WalletConnectionProps } from '@concordium/react-components';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import { RegisterExam } from './pages/RegisterExam';
import { TakeExam } from './pages/TakeExam';
import { MockExam } from './pages/MockExam';
// Temporarily commented out to reduce scope
// import { BecomeProctor, ProctorProvider } from './pages/BecomeProctor';
// import { ProctorExam } from './pages/ProctorExam';

function App(props: WalletConnectionProps) {
  return (
    <>
      {/* Temporarily commented out ProctorProvider to reduce scope */}
      {/* <ProctorProvider> */}
        <Router>
          <Routes>
            <Route path="/" element={<Layout {...props} />}>
              <Route path="/register" element={<RegisterExam {...props} />} />
              <Route path="/exam" element={<MockExam {...props} />} />
              <Route path="/mock-exam" element={<MockExam {...props} />} />
              {/* Temporarily commented out to reduce scope */}
              {/* <Route path="/become-proctor" element={<BecomeProctor {...props} />} /> */}
              {/* <Route path="/proctor" element={<ProctorExam {...props} />} /> */}
              <Route index element={<RegisterExam {...props} />} />
            </Route>
          </Routes>
        </Router>
        <Toaster position="top-right" richColors />
      {/* </ProctorProvider> */}
    </>
  );
}

export default App;
