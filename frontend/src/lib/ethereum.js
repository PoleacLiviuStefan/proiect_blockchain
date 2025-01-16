import { ethers } from 'ethers';
import BidingArtifact from '../../../contracts/artifacts/contracts/Biding.sol/Biding.json';
import BidingEscrowArtifact from '../../../contracts/artifacts/contracts/FreelanceEscrow.sol/FreelanceEscrow.json';

const BIDING_ADDRESS = "0x5B6Cf21bb0e8cB43d0bbadda249BcFe4C2703Cef";
const BIDING_ESCROW_ADDRESS = "0xc93276FA7123aE3E3cA3F5E0fCBb1dFb4e15AC51";

export const getBlockchain = async () => {
    if (typeof window.ethereum === 'undefined') {
        return { signer: undefined, contract: undefined, escrowContract: undefined };
    }

    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const contract = new ethers.Contract(
        BIDING_ADDRESS,
        BidingArtifact.abi,
        signer
    );

    const escrowContract = new ethers.Contract(
        BIDING_ESCROW_ADDRESS,
        BidingEscrowArtifact.abi,
        signer
    );

    return { signer, contract, escrowContract };
}