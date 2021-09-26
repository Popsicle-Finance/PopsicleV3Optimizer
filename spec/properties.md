1. rule No_share_no_withdraw
    share(user) == 0 => withdraw(user) == 0 (or revert) &&
                    collect(user) == 0 (or revert)
2. rule collectMonotonic
    collect() is monotonic
3. withdraw is additive
    Withdraw (depositA) + Withdraw(depositB) == Withdraw (depositA + depositB)
4. (amount0,amount1) =  withdraw
    (amount0 == 0 && amount1 == 0) ||
    (amount0 != 0 && amount1 != 0)
