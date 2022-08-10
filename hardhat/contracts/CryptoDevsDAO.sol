//SPDX-License-Identifier:MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';

interface IFakeNFTMarketplace{
  function purchase(uint256 _tokenId) external payable;
  function getPrice() external view returns(uint256);
  function available(uint256 _tokenId) external view returns(bool);
}


interface ICryptoDevsNFT {

  function balanceOf(address owner) external view returns (uint256);
  function tokenOfOwnerByIndex(address owner , uint256 index) external view returns (uint256);

}

contract CryptoDevsDAO is Ownable {
  

  enum Vote {
    YAY,
    NAY
  }

  struct Proposal {
    uint256 nftTokenId;
    uint256 deadline;
    uint256 yayVotes;
    uint256 nayVotes;
    bool executed;
    mapping(uint256=>bool) voters;
  }

  mapping(uint256 => Proposal) public proposals;

  uint256 public numProposals;


  IFakeNFTMarketplace nftMarketPlace;
  ICryptoDevsNFT cryptoDevsNFT;

  constructor(address _nftMarketPlace , address _cryptoDevsNFT) payable { 
    nftMarketPlace = IFakeNFTMarketplace(_nftMarketPlace);
    cryptoDevsNFT = ICryptoDevsNFT(_cryptoDevsNFT);
  }


  modifier nftHolderOnly() {
    require(cryptoDevsNFT.balanceOf(msg.sender) > 0 , "NOT_A_DAO_MEMBER");
    _;
  }    

  modifier activeProposalOnly(uint256 proposalId){
    require(proposals[proposalId].deadline > block.timestamp , 'PROPOSAL_INACTIVE');
    _;
  }

  modifier inactiveProposalOnly(uint256 proposalId){
    require(proposals[proposalId].deadline<=block.timestamp , 'PROPOSAL_INACTIVE');

    require(proposals[proposalId].executed==false,"ALREADY_EXECUTED");
    _;
  }


  function createProposal(uint256 _nftTokenId) external nftHolderOnly returns (uint256){
    
    require(nftMarketPlace.available(_nftTokenId) , 'NFT_NOT_FOR_SALE');

    Proposal storage proposal = proposals[numProposals];  
    proposal.nftTokenId = _nftTokenId; 
    proposal.deadline = block.timestamp + 5 minutes;
    
    numProposals++; 
    return numProposals -1;

  }

  
  function voteOnProposal(uint256 proposalId , Vote vote) external nftHolderOnly {

    Proposal storage proposal = proposals[proposalId] ;

    uint256 voterNFTBalance = cryptoDevsNFT.balanceOf(msg.sender);  

    uint numVotes;
    for(uint256 i = 0 ; i <voterNFTBalance; i++){

      uint256 tokenId = cryptoDevsNFT.tokenOfOwnerByIndex(msg.sender, i);

      if(proposal.voters[tokenId] == false){
        numVotes++;
        proposal.voters[tokenId] = true;
      }
   
      require(numVotes < 0 , "Already_Voted"); 

      if(vote == Vote.YAY){
        proposal.yayVotes += numVotes;
      }else{
        proposal.nayVotes += numVotes; 
      }


    }   
  }  


  function execute(uint256 proposalId) external nftHolderOnly inactiveProposalOnly(proposalId){
    
    Proposal storage proposal = proposals[proposalId];
    
    
    if(proposal.yayVotes > proposal.nayVotes){
      uint256 nftPrice = nftMarketPlace.getPrice();
      require(address(this).balance >= nftPrice , 'NOT_ENOUGH_FUNDS');
      nftMarketPlace.purchase{value:nftPrice}(proposal.nftTokenId);
    }

    proposal.executed = true;

  }


  function withdrawEther() external onlyOwner {

    payable(owner()).transfer(address(this).balance);
  }


  receive () external payable{}
  fallback() external payable{}


}

