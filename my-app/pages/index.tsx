import Image from 'next/image'
import{HiPlus} from 'react-icons/hi'
import{FaAngleLeft,FaAngleRight,FaRegThumbsUp,FaRegThumbsDown} from 'react-icons/fa'
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
import { formatEther } from 'ethers/lib/utils'
import { walletconnect } from 'web3modal/dist/providers/connectors'
import { isMinusToken } from 'typescript'
import { exit } from 'process'

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
  const [fakeNftTokenId,setFakeNftTokenId] = useState<any>('')
  const [loading,setLoading] = useState<boolean>(false)
  const viewORcreate: string[] = ['Create Proposals', 'View Proposals']
  const[imageLoaded,setImageLoaded] = useState<boolean>(false)
  const[getOut,setGetOut] = useState<boolean>(false)
  const[proposals ,setProposals] = useState<any>([])

  const [currentProposals,setCurrentProposals] = useState<any>('[]')

  const [thisProp,SetThisProp] = useState<number>(0)

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
        deadline: new Date(parseInt(proposal.deadline.toString()) *1000 ),
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


  const voteOnProposal = async(proposalId:any,_vote:any) => {
    setLoading(true)
    try{
      const signer = await getProviderOrSigner(true) 
      const daoContract = getDAOInstance(signer)

      let vote = _vote === 'YAY'? 0 :1

      const txn = await daoContract.voteOnProposal(proposalId,vote)
      await txn.wait()
      await fetchAllProposals()
    }
    catch(error){console.log(error)}
    setLoading(false)
  }

  const executeProposal = async(proposalId:number) =>{
    setLoading(true)
    try{

      const signer = await getProviderOrSigner(true)
      const daoContract = getDAOInstance(signer)
      const txn =  await daoContract.executeProposal(proposalId) 
      await txn.wait()
      await fetchAllProposals()
    }
    catch(error){console.log(error,'from exectute')}
    setLoading(false)
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
      getNumProposals()
    })
  }, [walletConnected])

  const getIn:Variants = {
    initial:{x:'-100%'},
    show:{x:0},
    exit:{x:'100%'}
  }

  const getInO:Variants = {
    initial:{opacity:0,filter:'blur(20px)',scale:.8},
    show:{opacity:1,filter:'blur(0px)',scale:1
    },
    exit:{opacity:0,filter:'blur(20px)',scale:1.1}
  }


  const renderCreate = () => {
    if(loading){
      return(
        <p 
         className='          
          z-10
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

const handleCount = (isMinus = false) =>{
  
    if(isMinus){
      if(thisProp === 0) return
      SetThisProp(thisProp-1)
    }else{
      if(thisProp === proposals.length-1) return
      SetThisProp(thisProp+1)
    }


}

  const dummy :Variants ={initial:{x:0},show:{x:0},exit:{x:0}}

  const renderView = () => {
    if(loading){
      return(
        <p 
         className='          
          z-10
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
    }else if(proposals.length === 0){
      return(
      <p>
          No proposals have been created.
        </p>
      )
    }else{
      return(
        <div
          className='
          min-h-[50vmin] 
          min-w-full
          flex flex-col items-stretch justify-start
          rounded-xl
          snap-mandatory snap-x
          ' >
          <div
           className='min-w-full text-4xl flex justify-between'
           >
            <button
              onClick={()=>{handleCount(true)}}
              className='
              bg-zinc-500 dark:bg-zinc-800
              thisButton px-4 py-2 flex items-center
              ' 
            >
            <FaAngleLeft  />
            </button>
              <button
               onClick={()=>{handleCount()}}
              className='
              bg-zinc-500 dark:bg-zinc-800
              thisButton px-4 py-2 flex items-center
              ' 
              >

            <FaAngleRight/>

            </button>
          </div>
<AnimatePresence 
    exitBeforeEnter
             >

          <motion.div
            variants={getInO}
            transition={{duration:.45}}
            initial={'initial'}
            animate={'show'}
            exit={'exit'}
            key={thisProp}
            className='
            rounded-xl
            flex 
            flex-col
            items-center justify-center
            gap-4
            py-5
            grow
            min-h-full 
            min-w-full
            '
            >
            <motion.table
            className='
            shadow-[0_2px_20px_-5px_rgba(0,0,0,.5)]
            rounded-xl overflow-hidden
            min-w-[35vmin]
            text-xs
            md:text-sm
            bg-zinc-200
                '
            >
            <tbody
              className=''
              >
              <tr
              className=''
                >
                <th> Proposals Id: </th>
                <td>{proposals[thisProp].proposalId}</td>
              </tr>
              <tr>
                <th> Fake NFT to Purschase:</th>
                <td>{proposals[thisProp].nftTokenId}</td>
              </tr>
                <tr>
                    <th>Deadline:</th>
                    <td
                       className='flex md:flex-col gap-3'
                       >
                        <span> 
                          {proposals[thisProp].deadline.getHours()} : {' '}
                          {proposals[thisProp].deadline.getMinutes()+1} : {' '}

                          {proposals[thisProp].deadline.getSeconds()}
                        </span>
                        <span className='whitespace-nowrap'>
                          {proposals[thisProp].deadline.getDate()} - {' '}
                          {proposals[thisProp].deadline.getMonth()+1} -{' '}
                          {proposals[thisProp].deadline.getFullYear()}
                        </span>
                    </td>
                </tr>
                <tr>
                  <th>Yay Votes:</th>
                  <td>{proposals[thisProp].yayVotes}</td>
                </tr>

                <tr>
                  <th>Nay Votes:</th>
                  <td>{proposals[thisProp].nayVotes}</td>
                </tr>
                <tr>
                    <th>Executed?:</th>
                    <td>{proposals[thisProp].executed.toString()}</td>
                </tr> 
            </tbody>
            </motion.table>


          {proposals[thisProp].deadline.getTime()>Date.now() && !proposals[thisProp].executed? (
            <div className='flex min-w-full justify-between '>
              <button className='thisButton md:text-sm text-xs flex items-center gap-2' 
              onClick={()=>voteOnProposal(proposals[thisProp].proposalId,'YAY')}>
                Vote YAY <FaRegThumbsUp/>
              </button>
              <button className='thisButton md:text-sm text-xs flex items-center gap-2 !bg-red-800'  
              onClick={()=>voteOnProposal(proposals[thisProp].proposalId,'NAY')}>
                Vote NAY <FaRegThumbsDown/>
              </button>

            </div>

          ):
          proposals[thisProp].deadline.getTime() < Date.now() && !proposals[thisProp].executed ? (
              
          <div 
           className='flex  min-w-full justify-center items-center gap-10'>
           <button
            onClick={()=>{
                    executeProposal(proposals[thisProp].proposalId );
                        console.log(proposals[thisProp].proposalId)
                      }}
            className='thisButton md:text-sm text-xs'
             >
            Execute Proposal{" "}
            {proposals[thisProp].yayVotes>proposals[thisProp].nayVotes ? '(YAY)' : '(NAY)'}
           </button>
           </div>
          ):
            <p className='thisButton bg-green-500 dark:bg-green-700 text-white' >Proposal executed!!</p>
            }

          </motion.div>

            </AnimatePresence>
        </div>
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
  if(tab === viewORcreate[1]){ 
  fetchAllProposals() 
  }}, [tab])

  return (
    <motion.div
      className=" 
      overflow-hidden
      shadow-2xl
      dark:shadow-[0_15px_50px_-15px_#020202]
      p-[2.5vmin]
      gap-[2vmin]
      md:gap-[5vmin]
      rounded-2xl
      md:min-h-[60vmin]
      min-h-[85vh]
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
        p-[2.5vmin]
        thisNeo
        rounded-xl
        min-w-[70vmin]
        md:min-w-[60vmin]
        flex flex-col
        md:gap-10  gap-4
        min-h-full"
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
        {walletConnected? 
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
              setTab(viewORcreate[1]);
              setGetOut(true)
            }}
            className="thisButton"
          >
            View Proposals
          </button>
        </div> : <button onClick={connectWallet} className='thisButton'>Connect Wallet</button>}
      </section>
  <div>
      </div>

    <section
       className='flex
        thisNeo
        items-start
        justify-center 
        rounded-xl
        grow
        relative 
        min-h-[60vmin]
        md:min-w-[60vmin] 
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
          absolute top-[45%]
          z-10
          rounded-full
          h-[8vmin] w-[8vmin]
          border-4 
          border-l-zinc-700
          border-zinc-200
          `}/>
       <AnimatePresence 
      >
      {getOut?
        (<motion.section      
        key={tab}
        transition={{duration:1}}
        variants={getIn}
        initial='initial'
        animate='show'
        exit='exit'
        className='
        gap-[2.5vmin]
        flex flex-col items-center 
        py-2
        justify-between
        bg-zinc-700 bg-opacity-10
        absolute
        min-h-[60vmin]
        md:min-w-[60vmin] 
        md:max-w-[60vmin]
        min-w-[80vmin]
              '
             >
      <div
        className='flex justify-around md:justify-between min-w-full items-center p-3'       
        >
        <p className='text-sm md:text-xl' >{tab}</p>
        <button 
          className='
                bg-red-600 dark:bg-green-800
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
        className='
                px-[5vmin]
                max-w-full
                flex grow items-center justify-center relative '>
            {renderTabs()}
              </div>
        </motion.section>)
        :
      <motion.div
        key={'second'}
        transition={{duration:1}}
        variants={getIn}
        initial='initial'
        animate='show'
        exit='exit'
        className={`
        absolute
        ${imageLoaded? 'opacity-100 blur-none':'blur-xl opacity-0'}
        transition-[filter,opacity]
        ease duration-1000 delay-1000
        md:min-w-[60vmin]
        min-w-[80vmin]
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
    </motion.div>
  )
}

export default Home
