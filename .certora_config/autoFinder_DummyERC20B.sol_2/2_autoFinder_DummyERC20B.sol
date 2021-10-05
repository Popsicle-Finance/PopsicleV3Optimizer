import "./IERC20.sol";
import "./SafeMath.sol";

contract DummyERC20B is IERC20 {
    using SafeMath for uint256;

    uint256 supply;
    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowances;

    string public name;
    string public symbol;
    uint public decimals;

    function totalSupply() external view override returns (uint256) {
        return supply;
    }
    function balanceOf(address account) external view override returns (uint256) {
        return balances[account];
    }
    function transfer(address recipient, uint256 amount) external override returns (bool) {
        balances[msg.sender] = balances[msg.sender].sub(amount);
        balances[recipient] = balances[recipient].add(amount);
        return true;
    }

    function allowance(address owner, address spender) external view override returns (uint256) {
        return allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        allowances[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external override returns (bool) {
        balances[sender] = balances[sender].sub(amount);
        balances[recipient] = balances[recipient].add(amount);
        allowances[sender][msg.sender] = allowances[sender][msg.sender].sub(amount);
        return true;
    }
	function certoraFunctionFinder67(uint256 p0, uint256 p1) external returns (uint256) {
		require(block.gaslimit == 0xbeef1b01);
		return SafeMath.add(p0, p1);
	}
	function certoraFunctionFinder68(uint256 p0, uint256 p1) external returns (uint256) {
		require(block.gaslimit == 0xbeef1b01);
		return SafeMath.div(p0, p1);
	}
	function certoraFunctionFinder69(uint256 p0, uint256 p1) external returns (uint256) {
		require(block.gaslimit == 0xbeef1b01);
		return SafeMath.mul(p0, p1);
	}
	function certoraFunctionFinder70(uint256 p0, uint256 p1) external returns (uint256) {
		require(block.gaslimit == 0xbeef1b01);
		return SafeMath.sub(p0, p1);
	}
}