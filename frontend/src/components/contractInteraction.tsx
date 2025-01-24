import React, { useState, useEffect } from 'react';
import { getBlockchain } from '../lib/ethereum';
import { ethers } from 'ethers';
import { parseEther, formatEther } from 'ethers';
import Job from './ui/job';

const ContractInteraction = () => {
  const [contract, setContract] = useState(null);
  const [escrowContract, setEscrowContract] = useState(null);
  const [signer, setSigner] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [activeView, setActiveView] = useState('all');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { contract, escrowContract, signer } = await getBlockchain();
        if (contract && signer) {
          setContract(contract);
          setEscrowContract(escrowContract);
          setSigner(signer);
          const address = await signer.getAddress();
          setCurrentAddress(address);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setError('Failed to connect to blockchain. Please make sure MetaMask is connected.');
      }
    };
    init();
  }, []);

  
  useEffect(() => {
    if (contract && currentAddress && escrowContract) {
      loadJobs();
    }
}, [contract, currentAddress, escrowContract]);


  // Funcție pentru verificarea job-ului prin escrow
  const verifyJobInEscrow = async (jobId) => {
    if (!escrowContract) return false;
    
    try {
      const isValid = await escrowContract.verifyJob(jobId);
      console.log(`Job ${jobId} escrow verification:`, isValid);
      return isValid;
    } catch (error) {
      console.error('Error verifying job in escrow:', error);
      return false;
    }
};

const postJob = async (description, budget) => {
  if (!contract || !signer || !escrowContract) {
    setError('Te rog conecteaza portofelul mai intai.');
    return;
  }

  setLoading(true);
  try {
    const contractWithSigner = contract.connect(signer);
    const budgetInWei = parseEther(budget.toString());

    console.log('Posting job with budget:', formatEther(budgetInWei), 'ETH');
    
    const tx = await contractWithSigner.postJob(description, {
      value: budgetInWei
    });
    
    const receipt = await tx.wait();
    console.log('Job posted, transaction hash:', receipt.hash);
    
    // Verificăm job-ul în escrow după creare
    const jobId = await contract.jobCounter();
    const isValid = await verifyJobInEscrow(jobId);
    
    if (!isValid) {
      setError('Job-ul nu a putut fi verificat in escrow');
    } else {
      console.log('Job verified in escrow successfully');
    }
    
    await loadJobs();
  } catch (error) {
    console.error('Error posting job:', error);
    setError(`Postarea job-ului a esuat: ${error.message}`);
  } finally {
    setLoading(false);
  }
};


  const applyForJob = async (jobId, bidAmount) => {
    if (!contract || !signer) {
      throw new Error('Please connect your wallet first');
    }

    setLoading(true);
    try {
      const contractWithSigner = contract.connect(signer);
      const job = await contract.jobs(jobId);
      const currentBids = await contract.getBids(jobId);

      const minBid = currentBids.length
        ? currentBids.reduce((min, bid) => (bid.bidAmount < min ? bid.bidAmount : min), currentBids[0].bidAmount)
        : job.budget;

      const minBidFreelancer = currentBids.find(bid => bid.bidAmount === minBid)?.freelancer;
      const bidAmountInWei = parseEther(bidAmount);

      if (bidAmountInWei >= minBid) {
        throw new Error('Oferta trebuie sa fie mai mica decat cea precedenta');
      }

      if (minBidFreelancer?.toLowerCase() === currentAddress?.toLowerCase()) {
        throw new Error('Ai deja oferta cea mai mica');
      }

      // Modificat pentru a trimite bidAmount ca parametru, nu ca value
      const tx = await contractWithSigner.placeBid(jobId, bidAmountInWei, {
        gasLimit: 300000
      });

      await tx.wait();
      await loadJobs();
    } catch (error) {
      console.error('Error applying for job:', error);
      if (error.code === 'CALL_EXCEPTION') {
        throw new Error('Transaction failed. Please make sure the bid amount is correct. Tranzactia a esuat. Te rog asigura-te ca suma licitata este corecta');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const loadJobs = async () => {
    if (!contract || !escrowContract) return;

    setLoading(true);
    try {
      const jobCounter = await contract.jobCounter();
      const jobsArray = [];

      for (let i = 1; i <= Number(jobCounter); i++) {
        const job = await contract.jobs(i);
        const bids = await contract.getBids(i);
        const isVerifiedInEscrow = await verifyJobInEscrow(i);

        const minBid = bids.length
          ? Math.min(...bids.map(bid => Number(bid.bidAmount)))
          : job.budget;

        const minBidFreelancer = bids.find(bid => Number(bid.bidAmount) === minBid)?.freelancer || null;

        jobsArray.push({
          id: job.id.toString(),
          description: job.description,
          budget: formatEther(job.budget),
          currentBid: formatEther(minBid),
          minBidFreelancer,
          employer: job.employer,
          isCompleted: job.isCompleted,
          winner: job.winner,
          isVerifiedInEscrow, // Adăugăm starea verificării escrow
          bids: bids.map(bid => ({
            freelancer: bid.freelancer,
            bidAmount: formatEther(bid.bidAmount),
          })),
        });
      }

      setJobs(jobsArray);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
};
  useEffect(() => {
    if (contract && currentAddress) {
      loadJobs();
    }
  }, [contract, currentAddress]);

  const filteredJobs = () => {
    switch (activeView) {
      case 'posted':
        return jobs.filter(job => job.employer.toLowerCase() === currentAddress?.toLowerCase());
      case 'applied':
        return jobs.filter(job => job.bids.some(bid => bid.freelancer.toLowerCase() === currentAddress?.toLowerCase()));
      default:
        return jobs;
    }
  };

  // const handleNetworkChange = async () => {
  //   try {
  //     await window.ethereum.request({
  //       method: 'wallet_switchEthereumChain',
  //       params: [{ chainId: '0x13881' }], // Mumbai testnet
  //     });
  //   } catch (error) {
  //     if (error.code === 4902) {
  //       try {
  //         await window.ethereum.request({
  //           method: 'wallet_addEthereumChain',
  //           params: [
  //             {
  //               chainId: '0x13881',
  //               chainName: 'Mumbai Testnet',
  //               nativeCurrency: {
  //                 name: 'MATIC',
  //                 symbol: 'MATIC',
  //                 decimals: 18,
  //               },
  //               rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
  //               blockExplorerUrls: ['https://mumbai.polygonscan.com'],
  //             },
  //           ],
  //         });
  //       } catch (addError) {
  //         console.error('Error adding network:', addError);
  //       }
  //     }
  //     console.error('Error switching network:', error);
  //   }
  // };

  return (
    <div className="p-4 min-h-[400px]">

      {/* {!isConnected && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Please connect your wallet to view jobs
          <button
            onClick={handleNetworkChange}
            className="ml-2 underline"
          >
            Schimba Reteaua
          </button>
        </div>
      )} */}

      {/* {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            onClick={() => setError(null)} 
            className="ml-2 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )} */}

      {isConnected && (
        <>
        <div className='flex flex-col items-center w-full'>
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveView('all')}
              className={`px-4 py-2 rounded ${activeView === 'all' ? 'bg-blue-500 text-white' : 'bg-blue-900'}`}
            >
              Toate Job-urile
            </button>
            <button
              onClick={() => setActiveView('posted')}
              className={`px-4 py-2 rounded ${activeView === 'posted' ? 'bg-blue-500 text-white' : 'bg-blue-900'}`}
            >
              Job-urile Mele Postate
            </button>
            <button
              onClick={() => setActiveView('applied')}
              className={`px-4 py-2 rounded ${activeView === 'applied' ? 'bg-blue-500 text-white' : 'bg-blue-900'}`}
            >
              Aplicarile mele
            </button>
          </div>

          {activeView === 'posted' && (
            <form 
              className="mb-6"
              onSubmit={async (e) => {
                e.preventDefault();
                const description = e.target.description.value;
                const budget = e.target.budget.value;
                await postJob(description, budget);
                e.target.reset();
              }}
            >
              <div className="flex flex-col gap-4 w-[500px]">
                <input
                  type="text"
                  name="description"
                  placeholder="Descriere Job"
                  className="border p-2 rounded"
                  required
                  disabled={loading}
                />
                <input
                  type="number"
                  name="budget"
                  step="0.000001"
                  min="0.000001"
                  placeholder="Buget in ETH"
                  className="border p-2 rounded"
                  required
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                  disabled={loading}
                >
                  {loading ? 'Procesare...' : 'Posteaza Job'}
                </button>
              </div>
            </form>
          )}
</div>
<ul className="grid grid-cols-3 gap-4 overflow-y-auto h-[500px] max-h-[400px]">
  {filteredJobs().map((job) => (
    <Job 
      key={job.id}
      job={job}
      contract={contract}
      escrowContract={escrowContract}
      signer={signer}
      currentAddress={currentAddress}
      loading={loading}
      onPlaceBid={applyForJob}
      onRefresh={loadJobs}
      isVerifiedInEscrow={job.isVerifiedInEscrow}
    />
  ))}
</ul>
        </>
      )}
    </div>
  );
};

export default ContractInteraction;