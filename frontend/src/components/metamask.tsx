import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import ContractABI from "./abi/UpworkPlatform.json"; // ABI-ul contractului

const CONTRACT_ADDRESS = "0xYourContractAddressHere"; // Adresa contractului tău

function metamaskConnection() {
  const [account, setAccount] = useState(null); // Adresa utilizatorului conectat
  const [contract, setContract] = useState(null); // Instanța contractului
  const [jobs, setJobs] = useState([]); // Lista job-urilor
  const [message, setMessage] = useState(""); // Mesaje de notificare

  // 1. Conectare la MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);

      // Setăm contractul
      const signer = provider.getSigner();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ContractABI, signer);
      setContract(contractInstance);

      setMessage("Wallet connected successfully!");
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      setMessage("Failed to connect wallet.");
    }
  };

  // 2. Postare Job
  const postJob = async (description, budget) => {
    if (!contract) return alert("Connect your wallet first!");
    try {
      const tx = await contract.postJob(description, ethers.utils.parseEther(budget));
      await tx.wait(); // Așteaptă finalizarea tranzacției
      setMessage("Job posted successfully!");
    } catch (error) {
      console.error("Error posting job:", error);
      setMessage("Failed to post job.");
    }
  };

  // 3. Obținere Job-uri
  const fetchJobs = async () => {
    if (!contract) return alert("Connect your wallet first!");
    try {
      const jobCounter = await contract.jobCounter();
      const jobsArray = [];
      for (let i = 1; i <= jobCounter; i++) {
        const job = await contract.jobs(i);
        jobsArray.push({
          id: job.id.toString(),
          employer: job.employer,
          description: job.description,
          budget: ethers.utils.formatEther(job.budget),
          isCompleted: job.isCompleted,
        });
      }
      setJobs(jobsArray);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setMessage("Failed to fetch jobs.");
    }
  };

  useEffect(() => {
    if (contract) fetchJobs();
  }, [contract]);

  return (
    <div>
      <h1>Upwork Platform</h1>
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <p>Connected as: {account}</p>
      )}

      <div>
        <h2>Post a Job</h2>
        <input id="description" placeholder="Job description" />
        <input id="budget" placeholder="Budget in ETH" type="number" />
        <button
          onClick={() =>
            postJob(
              document.getElementById("description").value,
              document.getElementById("budget").value
            )
          }
        >
          Post Job
        </button>
      </div>

      <div>
        <h2>Jobs</h2>
        <button onClick={fetchJobs}>Refresh Jobs</button>
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div key={job.id}>
              <h3>Job ID: {job.id}</h3>
              <p>Employer: {job.employer}</p>
              <p>Description: {job.description}</p>
              <p>Budget: {job.budget} ETH</p>
              <p>Status: {job.isCompleted ? "Completed" : "Open"}</p>
            </div>
          ))
        ) : (
          <p>No jobs found.</p>
        )}
      </div>

      <p>{message}</p>
    </div>
  );
}

export default metamaskConnection;
