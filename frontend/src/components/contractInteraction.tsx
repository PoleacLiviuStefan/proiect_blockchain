import React, { useState, useEffect } from 'react';
import { getBlockchain } from '../../lib/ethereum';
import { ethers } from 'ethers'
const ContractInteraction = () => {
    const [contract, setContract] = useState(null);
    const [signer, setSigner] = useState(null);
    const [jobs, setJobs] = useState([]);
  
    useEffect(() => {
      const init = async () => {
        const { contract, signer } = await getBlockchain();
        setContract(contract);
        setSigner(signer);
      };
      init();
    }, []);
  
    const postJob = async (description, budget) => {
      if (contract) {
        const tx = await contract.postJob(description, ethers.utils.parseEther(budget));
        await tx.wait();
        loadJobs();
      }
    };
  
    const loadJobs = async () => {
      if (contract) {
        const jobCounter = await contract.jobCounter();
        const jobsArray = [];
        for (let i = 1; i <= jobCounter; i++) {
          const job = await contract.jobs(i);
          jobsArray.push(job);
        }
        setJobs(jobsArray);
      }
    };
  
    useEffect(() => {
      if (contract) {
        loadJobs();
      }
    }, [contract]);
  
    return (
      <div>
        <h1>Upwork Platform</h1>
        <form onSubmit={(e) => {
          e.preventDefault();
          const description = e.target.description.value;
          const budget = e.target.budget.value;
          postJob(description, budget);
        }}>
          <input type="text" name="description" placeholder="Descriere job" required />
          <input type="number" name="budget" placeholder="Buget în ETH" required />
          <button type="submit">Postează Job</button>
        </form>
        <ul>
          {jobs.map((job, index) => (
            <li key={index}>
              <p>ID: {job.id.toString()}</p>
              <p>Descriere: {job.description}</p>
              <p>Buget: {ethers.utils.formatEther(job.budget)} ETH</p>
              <p>Angajator: {job.employer}</p>
              <p>Finalizat: {job.isCompleted ? 'Da' : 'Nu'}</p>
              <p>Câștigător: {job.winner !== ethers.constants.AddressZero ? job.winner : 'Niciunul'}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  };

export default ContractInteraction;
