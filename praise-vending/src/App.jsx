import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Gate from './pages/Gate';
import Home from './pages/Home';
import Write from './pages/Write';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Gate />} />
            <Route path="/home" element={<Home />} />
            <Route path="/write" element={<Write />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
