import { BrowserRouter, Routes, Route } from "react-router";

import { Navigation } from "@/components/navigation";
import Home from "@/pages/home";
import HelloNear from "@/pages/hello_near";
import { NearProvider } from 'near-connect-hooks';
import { Analytics } from "@vercel/analytics/react"


function App () {
  return (
      <NearProvider config={{ network: 'mainnet' }}>
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hello-near" element={<HelloNear />} />
        </Routes>
      </BrowserRouter>
      <Analytics />
    </NearProvider>
  );
};

export default App;
