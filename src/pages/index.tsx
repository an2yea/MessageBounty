import React from 'react';
import { useState, useEffect } from 'react';
import { ethers, Contract, BrowserProvider } from 'ethers';
import TimeLockedMessages from '@/pages/abis/TimeLockedMessages.json';


declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string }) => Promise<string[]>;
    };
  }
}


const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;

export default function Home() {
  const [message, setMessage] = useState<string>('');
  const [unlockTime, setUnlockTime] = useState<string>('');
  const [retrievedMessage, setRetrievedMessage] = useState<string>('');
  const [ensAddress, setEnsAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [account, setAccount] = useState<string>('');
  const [messageId, setMessageId] = useState<string>('');

  useEffect(() => {
    console.log(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY);
    if (typeof window.ethereum !== 'undefined') {
      // Check if MetaMask is installed
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
          }
        });
    }
  }, []);

  const getContract = async (): Promise<Contract> => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }
    const browserProvider = new BrowserProvider(window.ethereum);

    const signer = await browserProvider.getSigner();
  
    // Initialize the contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, TimeLockedMessages, signer);
  
    return contract;
  }; 
  const handleConnectWallet = async (): Promise<void> => {
    if (typeof window.ethereum !== 'undefined') {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      setIsConnected(true);
    } else {
      alert('Please install MetaMask!');
    }
  };

  const storeMessage = async (): Promise<void> => {
    if (!message || !unlockTime || !ensAddress) {
      alert('Please provide message, unlock time, and ENS address.');
      return;
    }

    const contract = await getContract();
    const lockDuration = parseInt(unlockTime);
    
    try {
      console.log('Storing message...');
      const tx = await contract.storeMessage(message, ensAddress, lockDuration);
      console.log('Transaction sent:', tx);
      const receipt = await tx.wait();
      console.log('Transaction receipt:', receipt);
      
      const event = receipt.events?.find((e: any) => e.event === 'MessageStored');
      if (event && event.args) {
        setMessageId(event.args.messageId);
        alert(`Message stored successfully! Message ID: ${event.args.messageId}`);
        console.log(`Message ID: ${event.args.messageId}`);
      } else {
        console.log('MessageStored event not found in receipt.');
      }
    } catch (error) {
      console.error('Error storing message:', error);
      alert('Error storing message');
    }
  };

  const getMessage = async (): Promise<void> => {
    if (!messageId) {
      alert('Please provide a message ID');
      return;
    }

    try {
      const contract = await getContract();
      const message = await contract.retrieveMessage(messageId);
      setRetrievedMessage(message);
    } catch (error) {
      console.error(error);
      alert('Message is still locked or does not exist.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Message Locker dApp</h1>

      {!isConnected ? (
        <button onClick={handleConnectWallet}>Connect MetaMask</button>
      ) : (
        <div>
          <p>Connected as: {account}</p>
        </div>
      )}

      <div>
        <h2>Store a Message</h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message"
          rows={4}
          style={{ width: '100%' }}
        />
        <br />
        <input
          type="number"
          value={unlockTime}
          onChange={(e) => setUnlockTime(e.target.value)}
          placeholder="Lock duration (in seconds)"
        />
        <br />
        <input
          type="text"
          value={ensAddress}
          onChange={(e) => setEnsAddress(e.target.value)}
          placeholder="ENS Address (e.g., example.eth)"
        />
        <br />
        <button onClick={storeMessage}>Store Message</button>
      </div>

      <div>
        <h2>Retrieve Message</h2>
        <input
          type="text"
          value={messageId}
          onChange={(e) => setMessageId(e.target.value)}
          placeholder="Enter message ID"
        />
        <button onClick={getMessage}>Get Message</button>
        <p>{retrievedMessage}</p>
      </div>
    </div>
  );
}
