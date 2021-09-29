
# Properties: 

  ## total assets of user:
        (amount0, amount1) = positionAmounts(pool, tickLower, tickUpper)
        token0.balanceOf(user) +  (amount0 + token0.balanceOf(SYSTEM)) * balanceOf[user] / totalSupply() 

        Should stay the same on deposit

        Should decrease on withdraw(share, user) by fee(share)

        should increase in any other function (by other users)

        ** we think this breaks on _compoundFees in case when the pool.mint returns values less than the current balance 


  ## additivity of withdraw 
        Withdraw (depositA) ; Withdraw(depositB) == Withdraw (depositA + depositB)

  ## Zero characteristic of withdraw:
        (amount0,amount1) =  withdraw(share, to) =>
            (amount0 == 0 && amount1 == 0) ||
            (amount0 != 0 && amount1 != 0)

    
  ## front running on withdraw (this broke but looks like fixed now)
        withdrawing the same amount at the same block yields the same token amounts 
            withdraw@user1(share, user1) ; withdraw@user2(share, user2) 
                token0.balanceOf[user1] ==  token0.balanceOf[user2]
                token1.balanceOf[user1] ==  token1.balanceOf[user2] 
 
  ## solvency of the system  
         
        (amount0, amount1) = positionAmounts(pool, tickLower, tickUpper)
        usersAmount0 = amount0 - protocolFees0
        amountInUniswapPerShare = usersAmount0 / totalSupply()

        amountInUniswapPerShare should stay the same on withdraw, deposit, ERC20 functions     
        

  ## rules on protocolFees
         reduced only on collectProtocolFee
         protocolFees0 can increase by 10% of current action 


 


    

