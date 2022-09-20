// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../libs/Base64.sol";
import "../erc721psi/ERC721Psi.sol";
import "../interfaces/IRoosterwarsNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "solidity-bits/contracts/BitMaps.sol";

contract RoosterwarsNFT is ERC721Psi, IRoosterwarsNFT, Ownable {
    
    error RoosterwarsNFT_CurrentLocked();

    using BitMaps for BitMaps.BitMap;
    BitMaps.BitMap private _burnedToken;

    enum TokenType {
        Type1,
        Type2,
        Type3,
        Type4
    }

    struct TokenMeta {
        uint256 tokenId;
        TokenType tokenType;
    }

    uint256 public constant SUPPLY_PER_TYPE = 50;                 // total supply: 50
    uint256 public constant PRICE_PER_TYPE = 5 * 100000000;       // $5
    
    string public baseURI;  
    string[] public typeNames = ["PlayRoosters1", "PlayRoosters2", "PlayRoosters3", "PlayRoosters4"];
    mapping (uint256 => TokenMeta) private _tokenMeta;
    mapping (TokenType => uint256) private _tokenTypes;
    bool private _locked;
    address private _treasury;

    AggregatorV3Interface internal priceFeedUsd;

    modifier validTokenType(TokenType tokenType) {
        require(tokenType >= TokenType.Type1 && tokenType <= TokenType.Type4,
            "Invalid token type");
        _;
    }

    constructor(string memory name_, string memory symbol_) 
        ERC721Psi(name_, symbol_) {
        
        _locked = true;
        baseURI = "https://gateway.pinata.cloud/ipfs/QmcRENdV5aFjmmUhLQkZ4Qmo8u9rMfWD8exy8uaF2rn51w/";

        // https://docs.chain.link/docs/ethereum-addresses/, ETH/USD on Rinkeby
        priceFeedUsd = AggregatorV3Interface(0x8A753747A1Fa494EC906cE90E9f37563A8AF630e);
    }

    function setTreasury(address treasury)
    external 
    onlyOwner {
        require(treasury != address(0), "Invalid treasury");
        _treasury = treasury;
    }

    function mint(address to, uint256 quantity, TokenType tokenType) 
    external 
    onlyOwner validTokenType(tokenType) {
        require(_tokenTypes[tokenType] + quantity <= SUPPLY_PER_TYPE, 
            "Overflow the totalsupply for the type");

        _safeMint(to, quantity);

        for (uint i = _minted; i > _minted - quantity; i--) {
            TokenMeta storage tokenMeta = _tokenMeta[i];
            tokenMeta.tokenId = i;
            tokenMeta.tokenType = tokenType;
        }
        _tokenTypes[tokenType] += quantity;

        emit Mint(_msgSender(), to, quantity);
    }

    function burn(uint256 tokenId) 
    external 
    onlyOwner {
        _tokenTypes[_tokenMeta[tokenId].tokenType]--;
        delete _tokenMeta[tokenId];

        _burn(tokenId);
        emit Burn(_msgSender(), tokenId);
    }


    function setBaseURI(string memory _newBaseURI) 
    public onlyOwner {
        baseURI = _newBaseURI;
    }

    function tokenURI(uint256 tokenId)
    public
    virtual override view returns (string memory)
    {
        if (!_exists(tokenId)) 
            revert URIQueryForNonexistentToken();

        TokenMeta memory tokenMeta = _tokenMeta[tokenId];
        string memory strTokenId = Strings.toString(tokenId);
        string memory strImage = Strings.toString(uint256(tokenMeta.tokenType));
        string memory s1 = string(
            abi.encodePacked(
                '{"id": ',
                strTokenId,
                ', "name": "',
                name(),
                ' #',
                strTokenId,
                '", "image": "',
                baseURI,
                strImage,
                '.mp4"'
            )
        );
        string memory s2 = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        s1,
                        ', "description": "PlayEstates Rooster Wars NFT"',
                        ', "attributes": [',
                        '{ "trait_type": "Price", "value": "5 USDC" }, ',
                        '{ "trait_type": "Rooster Wars Type", "value": "',
                        typeNames[uint256(tokenMeta.tokenType)],
                        '"}',
                        ']}'
                    )
                )
            )
        );

        string memory output = string(
            abi.encodePacked("data:application/json;base64,", s2)
        );
        return output;
    }

    function totalSupply() 
    public 
    virtual override view returns (uint256) {
        return _minted - _burned();
    }

    function getMintedPerType(TokenType tokenType)
    public 
    onlyOwner view returns (uint256) {
        return _tokenTypes[tokenType];
    }

    function unlock()
    public 
    onlyOwner {
        _locked = false;
    }

    function lock()
    public 
    onlyOwner {
        _locked = true;
    }

    function _beforeTokenTransfers(address from, address to, uint256 tokenId, uint256 quantity) 
    internal 
    override view {        
        if (from != address(0) && from != _treasury) {
            require(!_locked, "Roosterwars is locked");
        }
    }

    function _burn(uint256 tokenId) 
    internal virtual {
        address from = ownerOf(tokenId);
        _beforeTokenTransfers(from, address(0), tokenId, 1);
        _burnedToken.set(tokenId);
        
        emit Transfer(from, address(0), tokenId);

        _afterTokenTransfers(from, address(0), tokenId, 1);
    }
    
    function _burned() 
    internal 
    view returns (uint256 burned){
        uint256 totalBucket = (_minted >> 8) + 1;

        for(uint256 i=0; i < totalBucket; i++) {
            uint256 bucket = _burnedToken.getBucket(i);
            burned += _popcount(bucket);
        }
    }

    function _popcount(uint256 x) 
    private 
    pure returns (uint256 count) {
        unchecked{
            for (count=0; x!=0; count++)
                x &= x - 1;
        }
    }

    function _exists(uint256 tokenId) 
    internal 
    override virtual view returns (bool){
        if(_burnedToken.get(tokenId)) {
            return false;
        } 
        return super._exists(tokenId);
    }

    function _baseURI() 
    internal 
    override virtual view returns (string memory) {
        return baseURI;
    }

    // _usdPrice: USD Price * 100000000
    // _return: ETH Price (wei)
    function getPrice(int _usdPrice) 
    public 
    view returns (int) 
    {
        (
            uint80 roundID,
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeedUsd.latestRoundData();
        return _usdPrice * (10 ** 26) / price;                
    }
}