import { ethers, Contract } from 'ethers';
import TimeLockedMessages from '@/pages/abis/TimeLockedMessages.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY as string;

export const getContract = async (): Promise<Contract> => {
  // Connect to the Ethereum provider
  const provider = new ethers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
  
  // Get the signer (MetaMask or other wallet)
  const signer = await provider.getSigner();

  // Initialize the contract instance
  const contract = new ethers.Contract(CONTRACT_ADDRESS, TimeLockedMessages, signer);

  return contract;
}; 