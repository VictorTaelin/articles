import Prelude hiding (succ)

apply_n_times n f x = go n x where { go 0 r = r; go n r = go (n - 1) (f r) }

data Bin = O Bin | I Bin

peek :: Int -> Bin -> String
peek 0 xs     = ""
peek n (O xs) = "0" ++ peek (n - 1) xs
peek n (I xs) = "1" ++ peek (n - 1) xs

succ :: Bin -> Bin
succ (O xs) = I xs
succ (I xs) = O (succ xs)

zero :: Bin
zero = O zero

main = putStrLn $ peek 64 (apply_n_times (2 ^ 63) succ zero)
