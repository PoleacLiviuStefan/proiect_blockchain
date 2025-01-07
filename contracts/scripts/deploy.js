// Importă modulele necesare
const { ethers } = require("hardhat");

async function main() {
  // Obține contul utilizat pentru implementare
  const [deployer] = await ethers.getSigners();
  console.log("Implementarea contractului cu contul:", deployer.address);

  // Creează o instanță a ContractFactory pentru contractul Biding
  const Biding = await ethers.getContractFactory("Biding");

  // Implementarea contractului
  const biding = await Biding.deploy();

  // Așteaptă finalizarea implementării
  await biding.waitForDeployment();

  // Obține adresa contractului implementat
  const contractAddress = await biding.getAddress();
  console.log("Contractul Biding a fost implementat la adresa:", contractAddress);
}

// Execută funcția principală și gestionează erorile
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Eroare în timpul implementării:", error);
    process.exit(1);
  });