import React from 'react'
import { ethers } from 'ethers';

const ParticipantsList = ({job, contract, signer, currentAddress, setShowParticipants, loading }) => {
    const selectWinner = async (jobId, bidIndex) => {
        if (!contract || !signer) {
          throw new Error('Please connect your wallet first');
        }
    
        try {
          const contractWithSigner = contract.connect(signer);
          const tx = await contractWithSigner.selectWinner(jobId, bidIndex);
          await tx.wait();
          if (onRefresh) await onRefresh();
        } catch (error) {
          console.error('Error selecting winner:', error);
          throw new Error('Failed to select winner. Please try again.');
        }
    };
    console.log("job este: ",job)
    return (
        <div className='flex items-center justify-center w-full h-full'>
            <div className='relative w-[420px] h-[500px] bg-gray-700 text-white shadow-xl rounded-[12px] p-10'>
                <button 
                    onClick={() => setShowParticipants(false)} 
                    className='absolute top-4 right-4 bg-black rounded-full w-6 h-6 flex items-center justify-center text-[12px] hover:bg-gray-800'
                >
                    X
                </button>
                
                <ul className="space-y-4 overflow-y-auto max-h-[440px]">
                    {job.bids.map((bid, index) => (
                        <li 
                            key={index} 
                            className="flex flex-col  items-center gap-2 justify-between border border-gray-500 rounded-lg p-2"
                        >
                            <div className='flex flex-col items-center   text-center  break-all w-full md:w-auto'>
                                <span className="text-sm">{bid.freelancer}</span>
                                <span className="font-bold">{bid.bidAmount} ETH</span>
                            </div>
                            
                            {job.employer.toLowerCase() === currentAddress?.toLowerCase() && 
                             !job.isCompleted && 
                             job.winner === ethers.ZeroAddress && 
                             job.currentBid === bid.bidAmount && (

                                <button
                                    onClick={() => {
                                        try {
                                            selectWinner(job.id, index);
                                        } catch (error) {
                                            alert(error.message);
                                        }
                                    }}
                                    className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 whitespace-nowrap"
                                    disabled={loading}
                                >
                                    Selecteaza castigator
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

export default ParticipantsList