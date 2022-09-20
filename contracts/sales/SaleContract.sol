//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "erc721a/contracts/IERC721A.sol";
import "../interfaces/IMinionverseNFT.sol";
import "../interfaces/ISaleContract.sol";

contract SaleContract is ISaleContract, AccessControl, ReentrancyGuard {
    //Define Sales Schedule
    struct SaleSchedule {
        string name;
        uint256 discount;
        uint256 startTimestamp;
        uint256 duration;
    }
    using Strings for uint256;
    using ECDSA for bytes32;

    uint8 private constant ID_MOG = 0;
    uint8 private constant ID_INV = 1;

    uint256 private constant MOG_PRICE = 0.79 ether;
    uint256 private constant INV_PRICE = 0.079 ether;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");

    mapping(uint8 => uint8) public buyLimit;
    mapping(uint8 => uint8) public giftLimit;
    mapping(uint8 => uint256) public defaultPrices;
    mapping(uint8 => uint256) internal _totalSupply;
    mapping(uint8 => uint256) internal _giftSupply;
    mapping(address => bool) public whiteList;
    mapping(address => mapping(uint8 => uint256)) public buyerList;
    mapping(address => mapping(uint8 => uint256)) public giftList;

    uint8 public currentSaleID;
    bool public locked;
    bool public saleOnlyWhitelist;
    bool private _initialized;

    address public nftToken;
    address public tokenPool;
    address public treasuryAddress;
    address private _signerAddress;

    mapping(string => bool) private _usedNonces;
    string private _contractURI;

    SaleSchedule[] public saleSchedules;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(OWNER_ROLE, msg.sender);
        _signerAddress = msg.sender;

        defaultPrices[ID_MOG] = MOG_PRICE;
        defaultPrices[ID_INV] = INV_PRICE;

        addSchedule("WhiteList", 25, block.timestamp, 2 weeks);
        addSchedule("Pre-Sale", 10, block.timestamp + 2 weeks, 1 weeks);
        addSchedule("Public-Sale", 0, block.timestamp + 3 weeks, 1 weeks);

        setBuyLimit(ID_MOG, 3);
        setBuyLimit(ID_INV, 3);

        setGiftLimit(ID_MOG, 1);
        setGiftLimit(ID_INV, 1);
    }

    modifier initializer() {
        require(!_initialized, "ALREADY_INITIALIZED");
        _initialized = true;
        _;
    }

    function initialize(address token, address pool)
        external
        initializer
        checkSchedule
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        nftToken = token;
        tokenPool = pool;
    }

    function setupTreasury(address treasury)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        treasuryAddress = treasury;
    }

    function setSigner(address signer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _signerAddress = signer;
    }

    function getSigner() external view returns (address) {
        return _signerAddress;
    }

    function setDefaultPrice(uint8 tierIndex, uint256 price)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        defaultPrices[tierIndex] = price;
        emit UpdateDefaultPrice(msg.sender, tierIndex, price);
    }

    function addSchedule(
        string memory name,
        uint8 discount,
        uint256 startTimestamp,
        uint256 duration
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        saleSchedules.push(
            SaleSchedule({
                name: name,
                discount: discount,
                startTimestamp: startTimestamp,
                duration: duration
            })
        );
    }

    function updateSchedule(
        uint8 saleId,
        string memory name,
        uint8 discount,
        uint256 startTimestamp,
        uint256 duration
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(saleId > 0 && saleId <= saleSchedules.length, "SALE_ID_ERROR");
        unchecked {
            saleSchedules[saleId - 1].name = name;
            saleSchedules[saleId - 1].discount = discount;
            saleSchedules[saleId - 1].startTimestamp = startTimestamp;
            saleSchedules[saleId - 1].duration = duration;
        }
    }

    function removeSchedule(uint256 index) public onlyRole(DEFAULT_ADMIN_ROLE) {
        saleSchedules[index] = saleSchedules[saleSchedules.length - 1];
        saleSchedules.pop();
    }

    function setGiftLimit(uint8 tierIndex, uint8 limit)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
        onlyRole(OWNER_ROLE)
    {
        unchecked {
            giftLimit[tierIndex] = limit;
        }
        emit UpdateGiftLimit(msg.sender, tierIndex, limit);
    }
    function setBuyLimit(uint8 tierIndex, uint8 limit)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
        onlyRole(OWNER_ROLE)
    {
        unchecked {
            buyLimit[tierIndex] = limit;
        }
        emit UpdateBuyLimit(msg.sender, tierIndex, limit);
    }

    modifier checkSchedule() {
        uint8 saleID = 0;
        SaleSchedule[] memory schedules = saleSchedules;
        for (uint8 i = 0; i < schedules.length; i++) {
            uint256 start = schedules[i].startTimestamp;
            uint256 expired = start + schedules[i].duration;
            if (start <= block.timestamp && block.timestamp <= expired) {
                saleID = i + 1;
                break;
            }
        }
        require(saleID != 0, "SALE_EXPIRED");
        if (currentSaleID != saleID) currentSaleID = saleID;
        _;
    }
    modifier validSale() {
        require(currentSaleID != 0, "INVALID_SALE_ID");
        _;
    }
    modifier notLocked() {
        require(!locked, "SALE_LOCKED");
        _;
    }

    function currentSchedule()
        public
        view
        validSale
        returns (SaleSchedule memory)
    {
        SaleSchedule memory sale = saleSchedules[currentSaleID - 1];
        return sale;
    }

    function addToWhitelist(address[] calldata entries)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        onlyRole(OWNER_ROLE)
    {
        for (uint256 i = 0; i < entries.length; i++) {
            address entry = entries[i];
            require(entry != address(0), "NULL_ADDRESS");
            whiteList[entry] = true;
        }
    }

    function removeFromWhitelist(address[] calldata entries)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        onlyRole(OWNER_ROLE)
    {
        for (uint256 i = 0; i < entries.length; i++) {
            address entry = entries[i];
            require(entry != address(0), "NULL_ADDRESS");

            whiteList[entry] = false;
        }
    }

    function toggleSaleOnlyWhitelist()
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        onlyRole(OWNER_ROLE)
    {
        saleOnlyWhitelist = !saleOnlyWhitelist;
    }

    function discountPrice(uint8 tierIndex, uint256 tokenQuantity)
        public
        view
        validSale
        returns (uint256)
    {
        unchecked {
            SaleSchedule memory schedule = saleSchedules[currentSaleID - 1];
            uint256 orgPrice = defaultPrices[tierIndex];
            uint256 discount = tokenQuantity *
                (orgPrice - (orgPrice * schedule.discount) / 100);
            return discount;
        }
    }

    function _gift(
        address receiver,
        uint8 tierIndex,
        uint256 amount
    ) internal {
    }

    function gift(
        address receiver,
        uint8 tierIndex,
        uint256 tokenQuantity
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        onlyRole(OWNER_ROLE)
        onlyRole(MINTER_ROLE)
    {
        require(whiteList[receiver], "GIFT_NOT_QUALIFIED");
        _gift(receiver, tierIndex, tokenQuantity);
    }

    function giftEx(
        address receiver,
        uint8[] memory tierIndexes,
        uint256[] memory tokenQuantities
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        onlyRole(OWNER_ROLE)
        onlyRole(MINTER_ROLE)
    {
        require(
            tierIndexes.length == tokenQuantities.length,
            "GIFT_INPUT_INVALID"
        );
        require(whiteList[receiver], "GIFT_NOT_QUALIFIED");
        for (uint256 i = 0; i < tierIndexes.length; i++) {
            _gift(receiver, tierIndexes[i], tokenQuantities[i]);
        }
    }

    function giftToAll(
        address[] memory receivers,
        uint8[] memory tierIndexes,
        uint256[] memory tokenQuantities
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        onlyRole(OWNER_ROLE)
        onlyRole(MINTER_ROLE)
    {
        require(
            tierIndexes.length == tokenQuantities.length,
            "GIFT_INPUT_INVALID"
        );
        for (uint256 j = 0; j < receivers.length; j++)
            if (whiteList[receivers[j]])
                for (uint256 i = 0; i < tierIndexes.length; i++) {
                    _gift(receivers[j], tierIndexes[i], tokenQuantities[i]);
                }
    }

    function _buy(uint8 tierIndex, uint256 tokenQuantity) internal notLocked {
    }

    function whitelistBuy(uint8 tierIndex, uint256 tokenQuantity)
        external
        payable
        checkSchedule
        nonReentrant
    {
        require(whiteList[msg.sender], "NOT_QUALIFIED");
        require(
            discountPrice(tierIndex, tokenQuantity) <= msg.value,
            "INSUFFICIENT_PAYMENT"
        );
        _buy(tierIndex, tokenQuantity);
    }

    function whitelistBuyEx(
        uint8[] memory tierIndexes,
        uint256[] memory tokenQuantities
    ) external payable checkSchedule nonReentrant {
        require(whiteList[msg.sender], "NOT_QUALIFIED");
        uint256 totalPay = 0;
        for (uint256 i = 0; i < tierIndexes.length; i++) {
            totalPay += discountPrice(tierIndexes[i], tokenQuantities[i]);
        }
        require(totalPay <= msg.value, "INSUFFICIENT_PAYMENT");
        for (uint256 i = 0; i < tierIndexes.length; i++) {
            _buy(tierIndexes[i], tokenQuantities[i]);
        }
    }

    function hashTransaction(
        address sender,
        uint256 qty,
        string memory nonce
    ) private pure returns (bytes32) {
        bytes32 hash = prefixed(
            keccak256(abi.encodePacked(sender, qty, nonce))
        );

        return hash;
    }

    function matchAddresSigner(bytes32 hash, bytes memory signature)
        private
        view
        returns (bool)
    {
        // bytes32 messageDigest = keccak256(
        //     abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        // );
        // return _signerAddress == ECDSA.recover(messageDigest, signature);

        bytes32 pHash = prefixed(hash);
        return _signerAddress == pHash.recover(signature);
    }

    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
            );
    }

    function signBuy(
        bytes32 hash,
        bytes memory signature,
        string memory nonce,
        uint8 tierIndex,
        uint256 tokenQuantity
    ) external payable checkSchedule nonReentrant {
        require(matchAddresSigner(hash, signature), "DIRECT_BUY_DISALLOWED");
        require(!_usedNonces[nonce], "HASH_USED");
        require(
            hashTransaction(msg.sender, tokenQuantity, nonce) == prefixed(hash),
            "HASH_FAIL"
        );
        if (currentSaleID == 1 || saleOnlyWhitelist) {
            require(whiteList[msg.sender], "NOT_QUALIFIED");
        }

        require(
            discountPrice(tierIndex, tokenQuantity) <= msg.value,
            "INSUFFICIENT_PAYMENT"
        );

        _buy(tierIndex, tokenQuantity);

        _usedNonces[nonce] = true;
    }

    function signBuyEx(
        bytes32 hash,
        bytes memory signature,
        string memory nonce,
        uint8[] memory tierIndexes,
        uint256[] memory tokenQuantities
    ) external payable checkSchedule nonReentrant {
        require(matchAddresSigner(hash, signature), "DIRECT_BUY_DISALLOWED");
        require(!_usedNonces[nonce], "HASH_USED");
        if (currentSaleID == 1 || saleOnlyWhitelist) {
            require(whiteList[msg.sender], "NOT_QUALIFIED");
        }

        uint256 totalPay = 0;
        uint256 totalQuantity = 0;
        for (uint256 i = 0; i < tierIndexes.length; i++) {
            totalPay += discountPrice(tierIndexes[i], tokenQuantities[i]);
            totalQuantity += tokenQuantities[i];
        }
        require(
            hashTransaction(msg.sender, totalQuantity, nonce) == prefixed(hash),
            "HASH_FAIL"
        );
        require(totalPay <= msg.value, "INSUFFICIENT_PAYMENT");
        for (uint256 i = 0; i < tierIndexes.length; i++) {
            _buy(tierIndexes[i], tokenQuantities[i]);
        }

        _usedNonces[nonce] = true;
    }

    function toggleLock()
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        onlyRole(OWNER_ROLE)
    {
        locked = !locked;
        emit SetLock(msg.sender, locked);
    }

    function setContractURI(string calldata URI)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        notLocked
    {
        _contractURI = URI;
    }

    function totalSupply(uint8 tierIndex)
        public
        view
        override
        returns (uint256)
    {
        return _totalSupply[tierIndex];
    }
    function giftSupply(uint8 tierIndex)
        public
        view
        override
        returns (uint256)
    {
        return _giftSupply[tierIndex];
    }

    // aWYgeW91IHJlYWQgdGhpcywgc2VuZCBGcmVkZXJpayMwMDAxLCAiZnJlZGR5IGlzIGJpZyI=
    function contractURI() public view override returns (string memory) {
        return _contractURI;
    }

    function getNftToken() public view override returns (address) {
        require(nftToken != address(0), "TOKEN_ZERO_ADDRESS");
        return nftToken;
    }

    function getTokenPool() public view override returns (address) {
        require(tokenPool != address(0), "ACCOUNT_ZERO_ADDRESS");
        return tokenPool;
    }

    function balanceOf(address owner, uint8 tierIndex)
        public
        view
        override
        returns (uint256)
    {
        require(owner != address(0), "OWNER_ZERO_ADDRESS");
        return buyerList[owner][tierIndex];
    }

    function isBuyer(address user) public view override returns (bool) {
        return false;
    }

    function isWhitelist(address user) public view override returns (bool) {
        require(user != address(0), "USER_ZERO_ADDRESS");
        return whiteList[user];
    }

    function withdraw()
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        onlyRole(OWNER_ROLE)
        onlyRole(MINTER_ROLE)
    {
        address treasury = (treasuryAddress == address(0))
            ? msg.sender
            : treasuryAddress;
        (bool success, ) = payable(treasury).call{value: address(this).balance}(
            ""
        );
        require(success, "WITHDRAW_FAILED");

        emit Withdraw(msg.sender);
    }
}
