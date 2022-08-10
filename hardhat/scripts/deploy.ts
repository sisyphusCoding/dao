import { constants } from "ethers";
import { ethers } from "hardhat";
const {CRYPTODEVS_NFT_CONTRACT_ADDRESS } = require('../constants')

const main = async() => {
  
  const FakeNFTMarketplace = await ethers.getContractFactory('FakeNFTMarketPlace');


  const fakeNFTMarketplace = await FakeNFTMarketplace.deploy()

  await fakeNFTMarketplace.deployed()

  console.log('FakeNFTMarketplace:',fakeNFTMarketplace.address)

  const CryptDevsDAO = await ethers.getContractFactory('CryptDevsDAO')
  
  const cryptoDevsDAO = await CryptDevsDAO.deploy(
    fakeNFTMarketplace,
    CRYPTODEVS_NFT_CONTRACT_ADDRESS,{
        value: ethers.utils.parseEther('0.01')
    }
  )

  await cryptoDevsDAO.deployed()

  console.log('CryptDevsDAO adress:',cryptoDevsDAO.address)
  

}



main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
