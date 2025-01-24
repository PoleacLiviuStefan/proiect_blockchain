import React, { useCallback, useState } from 'react';
import { ethers } from 'ethers';
import ParticipantsList from './participantsList';

const Job = ({
    job,
    contract,
    escrowContract,
    signer,
    currentAddress,
    loading,
    onPlaceBid,
    onRefresh
}) => {

    const [showParticipants,setShowParticipants] = useState(false); 


  const handleBidSubmit = async (jobId, bidAmount) => {
    if (!onPlaceBid) return;
    try {
      await onPlaceBid(jobId, bidAmount);
    } catch (error) {
      console.error('Error placing bid:', error);
      alert(error.message || 'Failed to place bid');
    }
  };

  const verifyJobInEscrow = async () => {
    if (!escrowContract) {
      console.error('Escrow contract not initialized');
      return true; // Returnăm true pentru a permite completarea dacă escrow nu e disponibil
    }

    try {
      const isValid = await escrowContract.verifyJob(job.id);
      console.log('Job verification result:', isValid);
      return isValid;
    } catch (error) {
      console.error('Error verifying in escrow:', error);
      return true; // Returnăm true în caz de eroare pentru a nu bloca funcționalitatea
    }
  };

  const handleCompleteJob = async (jobId) => {
    if (!contract || !signer) {
      throw new Error('Please connect your wallet first');
    }

    try {
      let canComplete = true;
      
      if (escrowContract) {
        // Verifică în escrow doar dacă contractul există
        canComplete = await verifyJobInEscrow();
      }

      if (!canComplete) {
        throw new Error('Job verification in escrow failed');
      }

      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.completeJob(jobId);
      await tx.wait();
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('Error completing job:', error);
      throw error;
    }
  };

  return (
    <li className="border p-4 rounded shadow ">
      <p><strong>ID:</strong> {job.id}</p>
      <p><strong>Descriere:</strong> {job.description}</p>
      <p><strong>Buget:</strong> {job.budget} ETH</p>
      <p><strong>Oferta Curenta:</strong> {job.currentBid} ETH</p>
      <p><strong>Angajator:</strong> <span className="break-all">{job.employer}</span></p>
      <p><strong>Finalizat:</strong> {job.isCompleted ? 'Da' : 'Nu'}</p>
      <p><strong>Castigator:</strong> <span className="break-all">{job.winner !== ethers.ZeroAddress ? job.winner : '-'} </span></p>
      
      <div className="mt-4">
        <button onClick={()=>setShowParticipants(true)} className="font-bold mb-2 w-[200px]">Vezi Participantii</button>
        {
            showParticipants &&
            
        <div className='fixed top-0 left-0  h-screen w-screen bg-black bg-opacity-70 '>
        <ParticipantsList setShowParticipants={(value)=>setShowParticipants(value)} job={job} contract={contract} signer={signer} currentAddress ={currentAddress } />
        
        </div>
        }
      </div>

      <div className="mt-4 space-x-2">
        {job.winner.toLowerCase() === currentAddress?.toLowerCase() ? (
          <p className="text-green-600 font-semibold">Ai castigat licitatia!</p>
        ) : !job.isCompleted && job.employer.toLowerCase() !== currentAddress?.toLowerCase() && (
          job.minBidFreelancer?.toLowerCase() === currentAddress?.toLowerCase() ? (
            <p className="text-orange-600 font-semibold">Esti deja ultimul ofertant</p>
          ) : (
            <button
              onClick={() => {
                const bidAmount = prompt('Introdu oferta ta (ETH):');
                if (bidAmount) handleBidSubmit(job.id, bidAmount);
              }}
              className={`${loading ? "bg-gray-500" : "bg-green-500"} text-white py-2 px-4 rounded hover:bg-green-600 w-[200px] `}
              disabled={loading}
            >
              {loading? "Procesare Tranzactie" :"Liciteaza"}
            </button>
          )
        )}

        {/* {job.employer.toLowerCase() === currentAddress?.toLowerCase() && 
         job.winner !== ethers.ZeroAddress && 
         !job.isCompleted && (
          <button
            onClick={() => {
              try {
                completeJob(job.id);
              } catch (error) {
                alert(error.message);
              }
            }}
            className="bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600"
            disabled={loading}
          >
            Completeaza Job
          </button>
        )} */}
      </div>
      {job.employer.toLowerCase() === currentAddress?.toLowerCase() && 
       job.winner !== ethers.ZeroAddress && 
       !job.isCompleted && (
        <button
          onClick={async () => {
            try {
              await handleCompleteJob(job.id);
            } catch (error) {
              alert(error.message);
            }
          }}
          className="bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600"
          disabled={loading}
        >
          Complete Job
        </button>
      )}
    </li>
  );
};

export default Job;