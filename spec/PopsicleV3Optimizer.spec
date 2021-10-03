// additivity of withdraw 
rule additivityOfWithdraw(uint256 sharesA, uint256 sharesB, address to){
    env e;
	storage init = lastStorage;
	address from = e.msg.sender;

    uint256 amount00;
    uint256 amount01;

    uint256 amount10;
    uint256 amount11;

    amount00, amount01 = withdraw(e, sharesA, to);
    amount10, amount11 = withdraw(e, sharesB, to);

    uint256 amount20;
    uint256 amount21;

    amount20, amount21 = withdraw(e, sharesA + sharesB, to) at init;

    assert((amount20 == amount00 + amount10) && (amount21 == amount01 + amount11));
}
        
rule zeroCharacteristicOfWithdraw(uint256 shares, address to){
    env e;
    uint256 amount0;
    uint256 amount1;
    amount0,amount1 =  withdraw(e, shares, to);

    assert (amount0 == 0 && amount1 == 0) || (amount0 != 0 && amount1 != 0);
}


// (this broke but looks like fixed now)
rule frontRunningOnWithdraw(uint256 shares1, address user1, uint256 shares2, address user2){
    require (user1 != user2);
    env e1;
    env e2;
    require (e1.msg.sender == user1 && e2.msg.sender == user2);
    require e1.block.number == e2.block.number;

    amount00, amount01 = withdraw(e1, shares1, user1);
    amount10, amount11 = withdraw(e2, shares2, user2);
    address token0;
    address token1;
    assert(ERC20(token0).balanceOf(user1) ==  ERC20(token0).balanceOf(user2) && 
           ERC20(token1).balanceOf(user1) ==  ERC20(token1).balanceOf(user2) );
}

after calling rebalance, token0.balanceOf(this)==0 and token1.balanceOf(this)==0




