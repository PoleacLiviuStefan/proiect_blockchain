import { useState } from "react";
import { ethers } from "ethers";
import ContractInteraction from "./components/contractInteraction";

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [walletBalance, setWalletBalance] = useState("0");

  // Conectează portofelul și obține balanța
  async function connectWallet() {
    try {
      // Verifică dacă MetaMask este instalat
      if (typeof window.ethereum === "undefined") {
        alert("MetaMask is not installed. Please install it to use this feature.");
        return;
      }

      // Solicită acces la conturile utilizatorului
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length === 0) {
        alert("No accounts found. Please check MetaMask.");
        return;
      }

      const userAddress = accounts[0];
      setWalletAddress(userAddress);

      // Creează un provider utilizând BrowserProvider
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Obține balanța contului
      const balance = await provider.getBalance(userAddress);

      // Convertim balanța din wei în ETH și actualizăm state-ul
      const balanceInEth = ethers.formatEther(balance);
      setWalletBalance(balanceInEth);
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      alert("An error occurred while connecting to the wallet. Please try again.");
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Ethereum Wallet Balance</h1>
        <button onClick={connectWallet}>Connect Wallet</button>
        <h3>Wallet Address: {walletAddress || "Not Connected"}</h3>
        <h3>Wallet Balance: {walletBalance} ETH</h3>
      </header>
      <ContractInteraction/>
    </div>
  );
}

export default App;