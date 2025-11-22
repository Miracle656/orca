// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { Home } from "./pages/Home";
import "./App.css";
import { CreateCollection } from "./pages/CreateCollection";
import Launchpad from "./pages/Launchpad";
import { Tokens } from "./pages/Tokens";
import { TokenDetail } from "./pages/TokenDetail";
import { Collections } from "./pages/Collections";
import { CollectionDetail } from "./pages/CollectionDetail";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateCollection />} />
          <Route path="/launchpad" element={<Launchpad />} />
          <Route path="/tokens" element={<Tokens />} />
          <Route path="/token/:id" element={<TokenDetail />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/:id" element={<CollectionDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;