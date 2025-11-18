import { useEffect } from 'react';
import { MainPage } from './pages/MainPage';
import { validateEnv } from './config/env';
import './App.css';

function App() {
  useEffect(() => {
    validateEnv();
  }, []);

  return <MainPage />;
}

export default App;
