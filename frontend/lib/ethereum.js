import { ethers } from 'ethers';
import contractJSON from '../../contracts/artifacts/contracts/Biding.sol/Biding.json'
const contractABI = contractJSON.abi

const contractAddress = '0xEFD6113Ed07c3152cEf9CC885aF2e9a645683382';



export const getBlockchain = async () => {
 
  if (typeof window.ethereum !== 'undefined') {
    try {
      
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      
      const provider = new ethers.BrowserProvider(window.ethereum);

      
      const signer = await provider.getSigner();

      
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
