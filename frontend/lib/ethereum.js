import { ethers } from 'ethers';
import contractJSON from '../../contracts/artifacts/contracts/Biding.sol/Biding.json'
const contractABI = contractJSON.abi
// Adresa contractului implementat
const contractAddress = '0xf504b2860af3629fa55decdcba5aabe6067993fab5e73c7011c77b3452fbfca6';


// Funcție pentru a obține un provider și un semnatar
export const getBlockchain = async () => {
  // Verifică dacă MetaMask este instalat
  if (typeof window.ethereum !== 'undefined') {
    try {
      // Solicită permisiunea utilizatorului pentru a accesa conturile
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Creează un provider
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Obține semnatarul
      const signer = await provider.getSigner();

      // Creează o instanță a contractului
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      return { contract, signer };
    } catch (error) {
      console.error('Eroare la conectarea cu MetaMask:', error);
      return null;
    }
  } else {
    console.error('MetaMask nu este instalat.');
    return null;
  }
};
