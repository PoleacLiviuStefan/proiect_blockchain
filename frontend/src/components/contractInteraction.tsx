import React, { useState, useEffect } from 'react';
import { getBlockchain } from '../../lib/ethereum';
import { ethers } from 'ethers';
import { parseEther, formatEther } from 'ethers';

const ContractInteraction = () => {
  const [contract, setContract] = useState(null);
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
        const { contract, signer } = await getBlockchain();
        if (contract && signer) {
          setContract(contract);
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

  const postJob = async (description, budget) => {
    if (!contract || !signer) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.postJob(description, parseEther(budget));
      await tx.wait();
      await loadJobs();
    } catch (error) {
      console.error('Error posting job:', error);
      setError('Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyForJob = async (jobId, bidAmount) => {
    if (!contract || !signer) {
      setError('Please connect your wallet first');
      return;
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
        alert('Suma licitată trebuie să fie mai mică decât oferta curentă!');
        return;
      }

      if (minBidFreelancer?.toLowerCase() === currentAddress?.toLowerCase()) {
        alert('Deja ai pus cea mai mică licitație!');
        return;
      }

      const tx = await contractWithSigner.placeBid(jobId, {
        value: bidAmountInWei,
      });
      await tx.wait();
      await loadJobs();
    } catch (error) {
      console.error('Error applying for job:', error);
      setError('Failed to apply for job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    if (!contract) return;

    setLoading(true);
    try {
      const jobCounter = await contract.jobCounter();
      const jobsArray = [];

      for (let i = 1; i <= Number(jobCounter); i++) {
        const job = await contract.jobs(i);
        const bids = await contract.getBids(i);

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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Upwork Platform</h1>

      {!isConnected && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Please connect your wallet to view jobs
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {isConnected && (
        <>
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveView('all')}
              className={`px-4 py-2 rounded ${activeView === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Toate Joburile
            </button>
            <button
              onClick={() => setActiveView('posted')}
              className={`px-4 py-2 rounded ${activeView === 'posted' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Joburile Mele
            </button>
            <button
              onClick={() => setActiveView('applied')}
              className={`px-4 py-2 rounded ${activeView === 'applied' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Aplicările Mele
            </button>
          </div>

          <ul className="space-y-4">
            {filteredJobs().map((job) => (
              <li key={job.id} className="border p-4 rounded shadow">
                <p><strong>ID:</strong> {job.id}</p>
                <p><strong>Descriere:</strong> {job.description}</p>
                <p><strong>Buget:</strong> {job.budget} ETH</p>
                <p><strong>Current Bid:</strong> {job.currentBid} ETH</p>
                <p><strong>Angajator:</strong> {job.employer}</p>
                <p><strong>Finalizat:</strong> {job.isCompleted ? 'Da' : 'Nu'}</p>
                <p><strong>Câștigător:</strong> {job.winner !== ethers.ZeroAddress ? job.winner : 'Niciunul'}</p>
                <h4>Participanți:</h4>
                <ul>
                  {job.bids.map((bid, index) => (
                    <li key={index}>
                      {bid.freelancer} - {bid.bidAmount} ETH
                    </li>
                  ))}
                </ul>
                {!job.isCompleted && job.employer !== currentAddress && (
                  job.minBidFreelancer?.toLowerCase() === currentAddress?.toLowerCase() ? (
                    <p className="mt-2 text-orange-600 font-semibold">Deja licitat</p>
                  ) : (
                    <button
                      onClick={() => {
                        const bidAmount = prompt('Introduceți suma licitată (ETH):');
                        if (bidAmount) applyForJob(job.id, bidAmount);
                      }}
                      className="mt-2 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                      disabled={loading}
                    >
                      Aplică
                    </button>
                  )
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default ContractInteraction;