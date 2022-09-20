//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

interface ISaleContract {
    //Interface
    event Buy(address indexed buyer, uint8 tierIndex, uint256 quantity);
    event Gift(address indexed to, uint8 tierIndex, uint256 quantity);
    event SetLock(address, bool);
    event Withdraw(address indexed operator);
    event UpdateBuyLimit(
        address indexed operator,
        uint8 tierIndex,
        uint256 limit
    );
    event UpdateGiftLimit(
        address indexed operator,
        uint8 tierIndex,
        uint256 limit
    );
    event UpdateDefaultPrice(
        address indexed operator,
        uint8 tierIndex,
        uint256 price
    );

    function totalSupply(uint8 tierIndex) external view returns (uint256);
    function giftSupply(uint8 tierIndex) external view returns (uint256);

    function contractURI() external view returns (string memory);

    function getNftToken() external view returns (address);

    function getTokenPool() external view returns (address);

    function balanceOf(address owner, uint8 tierIndex)
        external
        view
        returns (uint256);

    function isBuyer(address user) external view returns (bool);

    function isWhitelist(address user) external view returns (bool);
}
