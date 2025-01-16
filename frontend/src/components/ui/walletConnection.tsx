import React, { useState } from 'react'
import { ethers } from "ethers";

const WalletConnection = ({walletBalance,setWalletBalance}) => {
    const [walletAddress, setWalletAddress] = useState("");

    const connectWallet =async() =>{
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
          alert(" A avut loc o eroare in timp ce se incerca conectarea la portofel. Te rog incearca din nou.");
        }
      }
  return (
    <div className='flex flex-col items-center w-full  space-y-4'>
    {!walletAddress && <h1 className='text-4xl'>Conecteaza-ti wallet-ul pentru a te identifica</h1>}
    
    <h3 className='text-lg'>Adresa Portofel:  {walletAddress ? <span className='font-bold'>{walletAddress}</span> : <button onClick={connectWallet}>Connecteaza Portofelul</button>}</h3>

    </div>
  )
}

export default WalletConnection