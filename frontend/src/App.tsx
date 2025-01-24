import { useState } from "react";

import ContractInteraction from "./components/contractInteraction";
import WalletConnection from "./components/ui/walletConnection";
import Header from "./components/ui/Header";

function App() {

  // Conectează portofelul și obține balanța
  const [walletBalance,setWalletBalance]=useState(0)

  return (
    <div className="App">
        <Header walletBalance={walletBalance} />
        <main className="flex flex-col justify-center items-center w-screen h-full mt-14">
        
      <WalletConnection walletBalance={walletBalance} setWalletBalance={(value)=>setWalletBalance(value)} />
      <ContractInteraction />
        </main>
    </div>
  );
}

export default App;