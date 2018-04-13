apply_n_times n f x = go n x where { go 0 r = r; go n r = go (n - 1) (f r) }
xor b               = case b of { True -> not; False -> id }

zip4 :: (a -> b -> c) -> (a,a,a,a) -> (b,b,b,b) -> (c,c,c,c)
zip4 f (ax,ay,az,aw) (bx,by,bz,bw) = (f ax bx, f ay by, f az bz, f aw bw)

main = do
  let a = (True, True, False, False)
  let b = (True, False, True, False)
  print $ apply_n_times (2 ^ 25) (zip4 xor a) b
