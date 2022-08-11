import Image from 'next/image'
import{HiPlus} from 'react-icons/hi'
import {motion, Variants,AnimatePresence} from 'framer-motion'
import { constants, Contract, providers } from 'ethers'
import Web3Modal, { setLocal } from 'web3modal'
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  DAO_ABI,
  DAO_ADDRESS
} from '../constants'
import { useEffect, useRef, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { table } from 'console'
import { formatEther } from 'ethers/lib/utils'
import { walletconnect } from 'web3modal/dist/providers/connectors'
import { sign } from 'crypto'

const Home = () => {
  interface thisSigner extends providers.JsonRpcSigner {
    getAddress(): Promise<string>
  }

  interface thisProvider extends providers.Web3Provider {
    getAddress(): Promise<string>
  }

  const [walletConnected, setWalletConnected] = useState(false)
  const web3ModalRef = useRef<Web3Modal>()
  const [nftBalance, setNftBalance] = useState<number>(0)
  const [treasuryBalance, setTreasuryBalance] = useState<any>('0')
  const [numProposals, setNumProposals] = useState<number>(0)
  const [tab, setTab] = useState<string>('')
  const [fakeNftTokenId,setFakeNftTokenId] = useState('')
  const [loading,setLoading] = useState<boolean>(false)
  const viewORcreate: string[] = ['Create Proposals', 'View Proposals']
  const[imageLoaded,setImageLoaded] = useState<boolean>(false)
  const[getOut,setGetOut] = useState<boolean>(false)
  const[proposals ,setProposals] = useState([])

  const getDAOInstance = (providerOrSigner: any) => {
    return new Contract(DAO_ADDRESS, DAO_ABI, providerOrSigner)
  }

  const getNFTInstance = (providerOrSigner: any) => {
    return new Contract(NFT_CONTRACT_ADDRESS,NFT_CONTRACT_ABI,providerOrSigner)
  }

  const getTreasuryBalance = async () => {
    try {
      const provider = await getProviderOrSigner()
      const balance = await provider?.getBalance(DAO_ADDRESS)
      setTreasuryBalance(balance?.toString())
    } catch (error) {
      console.log(error)
    }
  }

  const getNumProposals = async () => {
    try {
      const provider = await getProviderOrSigner()
      const contract = getDAOInstance(provider)
      const daoNUMProposal = await contract.numProposals()
      setNumProposals(daoNUMProposal.toString())
    } catch (error) {
      console.log(error)
    }
  }


  const getUserNFTBalance = async() =>{
    try{
    const signer  = await getProviderOrSigner(true) 
    const nftContract =  getNFTInstance(signer)
    const balance = await nftContract.balanceOf(signer?.getAddress())
    setNftBalance(parseInt(balance.toString()))      
    }
    catch(error){console.log(error)}
  }


  const createProposal = async() =>{ 

   setLoading(true)
    try{
      const signer = await getProviderOrSigner(true)
      const daoContract = getDAOInstance(signer)
      const txn = await daoContract.createProposal(fakeNftTokenId)
      await txn.wait()
      getNumProposals()      
    }
    catch(error){console.log(error)}
    setLoading(false)
  }


  const fetchProposalByID = async(id:any)=>{
    try{
    const provider = await getProviderOrSigner()
    const daoContract = getDAOInstance(provider)
    const proposal = await daoContract.proposals(id)
    const parsedProposal ={
        proposalId: id,
        nftTokenId: proposal.nftTokenId.toString(),
        deadline: new Date(parseInt(proposal.deadline.toString())),
        yayVotes: proposal.yayVotes.toString(),
        nayVotes:proposal.nayVotes.toString(),
        executed: proposal.executed
      }
      return parsedProposal
    }
    catch(error){console.log(error)}
  }

  
  const fetchAllProposals = async() =>{
    try{
      const proposals = []
      for(let i = 0 ; i < numProposals;i++){
      const proposal = await fetchProposalByID(i)
        proposals.push(proposal)
      }
      setProposals(proposals)
      return proposals
    }
    catch(error){console.log(error)}
  }


  const connectWallet = async () => {
    try {
      await getProviderOrSigner()
      setWalletConnected(true)
    } catch (error) {
      console.log(error)
    }
  }

  const getProviderOrSigner = async (needSigner = false) => {
    try {
      const provider = await web3ModalRef.current?.connect()
      const web3Provider = new providers.Web3Provider(provider)
      const { chainId } = await web3Provider.getNetwork()
      if (chainId !== 4) {
        toast.error('Connect to Rinkeby network', { id: 'rinkebyError' })
      } else {
        toast.success('Connected to Rinkeby network', { id: 'rinkebysuccess' })
      }
      if (needSigner) {
        const signer = web3Provider.getSigner() as thisSigner
        return signer 
      }
      return web3Provider as thisProvider
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: 'rinkeby',
        providerOptions: {},
        disableInjectedProvider: false
      })
    }

    connectWallet().then(() => {
      getTreasuryBalance()
      getUserNFTBalance()
    })
  }, [walletConnected])

  const getIn:Variants = {
    initial:{x:'-200%'},
    show:{x:0},
    exit:{x:'200%'},
  }

  const renderCreate = () => {
    if(loading){
      return(
        <p 
         className='          
          z-10
          left-full
          animate-spin
          rounded-full
          h-[8vmin]
          w-[8vmin]
          absolute
          border-4 
          border-l-zinc-900
          border-zinc-200
          '/>
      )
    } else if(nftBalance === 0 ){
      return(
        <p
          className='text-lg'
          >
          You do not own any CryptoDevs NFTs.<br/>
          You cannot create or vote on proposals.
        </p>
      )
    }else{
      return(
        <div 
        className='w-full flex justify-between items-start flex-col gap-5'
        >
          <form>
          <label>Fake NFT Token ID to purchase: </label>
          <input 
            className='
            ouline-none active:outline-none focus:outline-none
            shadow-[0_4px_10px_-5px_rgba(0,0,0,.7)]
            w-3/12 px-3 py-2 rounded-xl bg-zinc-700 bg-opacity-10'
            min={0}
           placeholder='0'
           type='number'
           onChange={(e)=>setFakeNftTokenId(e.target.value)}
            />
          </form>
           <button 
            onClick={createProposal}
           className='thisButton flex items-center gap-1'  
           >
            <span>Create</span> <HiPlus/>
          </button> 
        </div>
      )
    }
    
  }
  const renderView = () => {
    if(loading){
      return(
        <p 
         className='          
          z-10
          left-full
          animate-spin
          rounded-full
          h-[8vmin]
          w-[8vmin]
          absolute
          border-4 
          border-l-zinc-900
          border-zinc-200
          '/>
      )
    }else if(proposals.length ===0){
      return(
      <p>
          No proposals have been created.
        </p>
      )
    }
  }

  const renderTabs = () => {
    if (tab === viewORcreate[0]) { 
      return renderCreate()
    } else if (tab === viewORcreate[1]) {
      return renderView()
    } else{
    return null}
  }

  console.log(tab)
  useEffect(() => {
    renderTabs()
  }, [tab])

  return (
    <div
      className=" 
      overflow-hidden
      shadow-2xl
      dark:shadow-[0_15px_50px_-15px_#020202]
      p-10
      gap-[5vmin]
      rounded-2xl
      min-h-[60vmin]
      flex-col md:flex-row
      flex "
    >
    <Toaster
        position="top-left"
        toastOptions={{
          error: {
            iconTheme: {
              primary: '#eee',
              secondary: '#555'
            },
            style: {
              background: '#EB1D36',
              color: '#eee'
            }
          }
        }}
      />
      <section
        className="
        p-10
        thisNeo
        rounded-xl
        min-w-[70vmin]
        flex flex-col
        gap-10
        min-h-full grow"
      >
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl md:text-4xl">Welcome to Crypto Devs!</h1>
          <h2 className="md:text-2xl">Welcome to the DAO!</h2>
        </div>
        <div
          className="
          flex flex-col gap-3"
        >
          <h4
            className="
            thisData
            "
          >
            <span>Your CryptoDevs NFT balance:</span>
            <span className=" rounded-md px-2 py-0.5 font-semibold">
              {nftBalance}
            </span>
          </h4>

          <h4 className="thisData">
            <span>Treasury balance:</span>
            <span className=" rounded-md px-2 py-0.5 font-semibold">
              {formatEther(treasuryBalance)} 
              <strong className='text-xs'> ETH</strong>
            </span>
          </h4>

          <h4 className="thisData">
            <span>Total Proposals:</span>
            <span className=" rounded-md px-2 py-0.5 ml-2 font-semibold">
              {numProposals}
            </span>
          </h4>
        </div>
        <div className="flex flex-row gap-5">
        <button
          onClick={() => {
          setTab(viewORcreate[0]);
          setGetOut(true)
          }}
            className="thisButton"
          >
            Create Proposals
          </button>
          <button
            onClick={() => {
              setTab(viewORcreate[1])
            }}
            className="thisButton"
          >
            View Proposals
          </button>
        </div>
      </section>
  <div>
      </div>

    <section
       className='flex items-center 
         min-h-full
        justify-center 
        relative 
        md:min-w-[50vmin] 
        min-w-[80vmin]
        overflow-hidden
        '
       >
    <p 
    className={` 
        ${imageLoaded? 'opacity-0 blur-xl ':'opacity-100 blur-0 '}
          transition-all
          ease duration-500 delay-500
          animate-spin
          z-10
          rounded-full
          h-[8vmin] w-[8vmin]
          absolute
          border-4 
          border-l-zinc-700
          border-zinc-200
          `}/>
       <AnimatePresence 
        exitBeforeEnter
      >
      {getOut?
        (<motion.section      
        key={'one'}
        variants={getIn}
        initial='initial'
        animate='show'
        exit='exit'
        transition={{duration:1}}
          className='
        p-5
        flex flex-col items-start justify-center
        bg-zinc-700 bg-opacity-10
        rounded-xl
        min-h-full
        md:min-w-[50vmin] 
        min-w-[80vmin]
              '
             >
      <div
        className='min-w-full flex justify-between items-center'       
        >
        <p className='text-lg md:text-xl' >{tab}</p>
        <button 
          className='
                bg-red-600 dark:bg-green-800
                px-3 py-2
                thisButton
                self-end 
                outline-none
                text-xs
                '
          onClick={()=>{setGetOut(false)}}>
                CLOSE
              </button>      

              </div>
       <div 
        className='flex grow items-center justify-center relative'>
            {renderTabs()}
              </div>
        </motion.section>)
        :
      <motion.div
        transition={{duration:1}}
        key={'second'}
        variants={getIn}
        initial='initial'
        animate='show'
        exit='exit'
        className={`
        ${imageLoaded? 'opacity-100 blur-none':'blur-xl opacity-0'}
        transition-[filter,opacity]
        ease duration-1000 delay-1000
        md:w-[50vmin]
        w-[30vmin]
        `}
      >
        <Image
          onLoad={()=>{setImageLoaded(true)}}
          alt="header-image"
          layout="responsive"
          objectFit="contain"
          src={'/cryptodev.svg'}
          height={100}
          width={100}
        />
      </motion.div>
        }
        </AnimatePresence> 
      </section>
    </div>
  )
}

export default Home
