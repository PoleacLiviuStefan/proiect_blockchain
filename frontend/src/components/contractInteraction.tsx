import React, { useState, useEffect } from 'react';
import { getBlockchain } from '../../lib/ethereum';
import { ethers } from 'ethers';

const ContractInteraction = () => {
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [activeView, setActiveView] = useState('all');
  const [appliedJobs, setAppliedJobs] = useState(new Set());
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
        } else {
          setIsConnected(false);
          setJobs([]);
          throw new Error("Failed to initialize contract or signer");
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setError('Failed to connect to blockchain. Please make sure MetaMask is connected.');
        setIsConnected(false);
        setJobs([]);
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
    setError(null);

    try {
      const contractWithSigner = contract.connect(signer);
      const budgetInWei = ethers.parseEther(budget.toString());
      
      const tx = await contractWithSigner.postJob(description, {
        value: budgetInWei,
        gasLimit: 500000
      });
      
      await tx.wait();
      await loadJobs();
    } catch (error) {
      console.error('Error posting job:', error);
      setError('Failed to post job. Please check your wallet and try again.');
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
    setError(null);

    try {
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.placeBid(jobId, {
        value: ethers.parseEther(bidAmount.toString()),
        gasLimit: 300000
      });
      
      await tx.wait();
      setAppliedJobs(prev => new Set(prev).add(jobId));
      await loadJobs();
    } catch (error) {
      console.error('Error applying for job:', error);
      setError('Failed to apply for job. Please check your wallet and try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    if (!contract || !currentAddress || !isConnected) {
      setJobs([]);
      return;
    }

    try {
      const jobCounter = await contract.jobCounter();
      const jobsArray = [];
      
      const jobCount = Number(jobCounter.toString());
      
      for (let i = 1; i <= jobCount; i++) {
        try {
          const job = await contract.jobs(i);
          const bids = await contract.getBids(i);
          
          jobsArray.push({
            id: job.id.toString(),
            description: job.description,
            budget: job.budget.toString(),
            employer: job.employer,
            isCompleted: job.isCompleted,
            winner: job.winner,
            hasApplied: bids.some(bid => bid.freelancer.toLowerCase() === currentAddress?.toLowerCase())
          });
        } catch (err) {
          console.error(`Error loading job ${i}:`, err);
        }
      }
      
      setJobs(jobsArray);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError('Failed to load jobs');
      setJobs([]);
    }
  };

  useEffect(() => {
    if (contract && currentAddress && isConnected) {
      loadJobs();
    } else {
      setJobs([]);
    }
  }, [contract, currentAddress, isConnected]);

  const filteredJobs = () => {
    switch (activeView) {
      case 'posted':
        return jobs.filter(job => job.employer.toLowerCase() === currentAddress?.toLowerCase());
      case 'applied':
        return jobs.filter(job => job.hasApplied);
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

          {activeView === 'all' && (
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
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  name="description"
                  placeholder="Descriere job"
                  className="border p-2 rounded"
                  required
                  disabled={loading}
                />
                <input
                  type="number"
                  name="budget"
                  step="0.01"
                  placeholder="Buget în ETH"
                  className="border p-2 rounded"
                  required
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                  disabled={loading}
                >
                  {loading ? 'Se procesează...' : 'Postează Job'}
                </button>
              </div>
            </form>
          )}

          <ul className="space-y-4">
            {filteredJobs().map((job) => (
              <li key={job.id} className="border p-4 rounded shadow">
                <p><strong>ID:</strong> {job.id}</p>
                <p><strong>Descriere:</strong> {job.description}</p>
                <p><strong>Buget:</strong> {ethers.formatEther(job.budget)} ETH</p>
                <p><strong>Angajator:</strong> {job.employer}</p>
                <p><strong>Finalizat:</strong> {job.isCompleted ? 'Da' : 'Nu'}</p>
                <p><strong>Câștigător:</strong> {job.winner !== ethers.ZeroAddress ? job.winner : 'Niciunul'}</p>
                
                {!job.isCompleted && 
                 job.employer.toLowerCase() !== currentAddress?.toLowerCase() && 
                 !job.hasApplied && (
                  <button
                    onClick={() => {
                      const bidAmount = prompt('Introduceți suma pentru care doriți să aplicați (în ETH):');
                      if (bidAmount) {
                        applyForJob(job.id, bidAmount);
                      }
                    }}
                    className="mt-2 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                    disabled={loading}
                  >
                    Aplică
                  </button>
                )}
                
                {job.hasApplied && (
                  <p className="mt-2 text-green-600 font-semibold">Ai aplicat la acest job</p>
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