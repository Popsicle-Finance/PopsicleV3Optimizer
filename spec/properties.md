
# Properties: 

  ## total assets of user:
        (amount0, amount1) = positionAmounts(pool, tickLower, tickUpper)
        (protocol0, protocol1) = amountsForLiquidity(pool, protocolFee0, _tickLower, _tickUpper)
        usersAmount0 = amount0 - protocolFees0
        token0.balanceOf(user) +  usersAmount0 * balanceOf[user] / totalSupply() 

        Should stay the same on deposit

        Should decrease on withdraw(share, user) by fee(share)

        should increase in any other function (by other users)

        ** we think this breaks on _compoundFees in case when the pool.mint returns values less than the current balance 


  ## additivity of withdraw 
        Withdraw (shareX, msg.sender) ; Withdraw(shareY, msg.sender) == Withdraw (shareX + shareY, msg.sender)

        balanceof[msg.sender] >= shareX + shareY 
        token0.balanceOf[msg.sender]
        token1.balanceOf[msg.sender]

  ## Zero characteristic of withdraw:
        (amount0,amount1) =  withdraw(share, to) =>
            (amount0 == 0 && amount1 == 0) ||
            (amount0 != 0 && amount1 != 0)
        does not hold when out-of-range

    
  ## front running on withdraw (this broke but looks like fixed now)
        withdrawing the same amount at the same block yields the same token amounts 
            withdraw@user1(share, user1) ; withdraw@user2(share, user2) 
                token0.balanceOf[user1] ==  token0.balanceOf[user2]
                token1.balanceOf[user1] ==  token1.balanceOf[user2] 
 
  ## solvency of the system  
         
        (amount0, amount1) = positionAmounts(pool, tickLower, tickUpper)
        usersAmount0 = amount0 - protocolFees0
        amountInUniswapPerShare0 = usersAmount0 / totalSupply()

        amountInUniswapPerShare should stay the same on withdraw, deposit, ERC20 functions  if no fee collected if ratio didn't hange

        if fees collected amountInUniswapPerShare can only increase    

        amountInUniswapPerShare0 anti-monotonicity amountInUniswapPerShare1 (because of swap and flashloans )
        

  ## rules on protocolFees
         reduced only on collectProtocolFee
         protocolFees0 can increase by 10% of current action 

        collectProtocolFee()
        protocolFees0 = 0; 
        f() /* withdraw, deposit, ... */
        assert ( protocolfee < 10% for fees by pook(0)
        

 
  ## impact by uniswap
     first deposit or swap with flashloan to uniswap and optimizer will be effected 

    

