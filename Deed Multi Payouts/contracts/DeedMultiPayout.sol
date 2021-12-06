pragma solidity >=0.5.0;

contract DeedMultiPayout {
    address public lawyer;
    address payable public beneficiary;
    uint256 public earliest;
    uint256 public amount;
    uint256 public constant PAYOUTS = 4;
    uint256 public constant INTERVAL = 1;
    uint256 public paidPayouts;

    constructor(
        address _lawyer,
        address payable _beneficiary,
        uint256 fromNow
    ) public payable {
        lawyer = _lawyer;
        beneficiary = _beneficiary;
        earliest = block.timestamp + fromNow;
        amount = msg.value / PAYOUTS;
    }

    function withdraw() public {
        require(msg.sender == lawyer, "lawyer only");
        require(block.timestamp >= earliest, "too early");
        require(paidPayouts < PAYOUTS, "no payout left");

        uint256 elligiblePayouts = 1 + (block.timestamp - earliest) / INTERVAL;
        uint256 duePayouts = elligiblePayouts - paidPayouts;
        duePayouts = duePayouts + paidPayouts > PAYOUTS
            ? PAYOUTS - paidPayouts
            : duePayouts;
        paidPayouts += duePayouts;
        beneficiary.transfer(duePayouts * amount);
    }
}
