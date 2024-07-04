import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/navbar";
import { Shop } from "./pages/shop/shop";
import { Contact } from "./pages/contact";
import { Cart } from "./pages/cart/cart";
import { ProductPage } from "./pages/product/ProductPage";
import { ShopContextProvider } from "./context/shop-context";
import { SearchProvider } from "./context/search-context";

function App() {
  return (
    <div className="App">
      <ShopContextProvider>
        <SearchProvider>
          <Router>
            <Navbar />
            <Routes>
              <Route path="/" element={<Shop />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/product/:id" element={<ProductPage />} />
            </Routes>
          </Router>
        </SearchProvider>
      </ShopContextProvider>
    </div>
  );
}

export default App;
