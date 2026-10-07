import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductPage from './pages/ProductPage';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main className="app__main">
            <div className="container">
              <Routes>
                 <Route path="/" element={<HomePage />} />
                 <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/product/:id" element={<ProductPage />} />
             </Routes>
            \</div>
        </main>
        
 
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
