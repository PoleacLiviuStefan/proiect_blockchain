const { ethers } = require("hardhat");

async function main() {
  // Obține contul utilizat pentru implementare
  const [deployer] = await ethers.getSigners();
  console.log("Implementarea contractelor cu contul:", deployer.address);

  // Deploy Biding contract
  const Biding = await ethers.getContractFactory("Biding");
  const biding = await Biding.deploy();
  await biding.waitForDeployment();
  const bidingAddress = await biding.getAddress();
  console.log("Contractul Biding a fost implementat la adresa:", bidingAddress);

  // Deploy FreelanceEscrow contract (modificat de la BidingEscrow)
  const FreelanceEscrow = await ethers.getContractFactory("FreelanceEscrow");
  const freelanceEscrow = await FreelanceEscrow.deploy(bidingAddress);
  await freelanceEscrow.waitForDeployment();
  const escrowAddress = await freelanceEscrow.getAddress();
  console.log("Contractul FreelanceEscrow a fost implementat la adresa:", escrowAddress);

  // Log toate adresele pentru verificare ușoară
  console.log("\nAdrese contracte deployate:");
  console.log("-------------------");
  console.log("Biding:", bidingAddress);
  console.log("FreelanceEscrow:", escrowAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Eroare în timpul implementării:", error);
    process.exit(1);
  });