# Supercompilation-like performance on the abstract algorithm

The [abstract-algorithm](https://github.com/MaiaVictor/abstract-algorithm) is how I call a very simple (~200 LOC!), elegant abstract machine that evaluates λ-calculus terms optimally. In this article, I'll show 2 small experiments in which my 200-LOC JavaScript evaluator beats GHC (The Glorious Glasgow Haskell Compiler) by a few orders of magnitude.

## zipWith tuples

Mind the following program:

```haskell
apply_n_times n f x = go n x where { go 0 r = r; go n r = go (n - 1) (f r) }
xor b               = case b of { True -> not; False -> id }
toList   (x,y,z,w)  = [x,y,z,w]
fromList [x,y,z,w]  = (x,y,z,w)

zip4 :: (a -> b -> c) -> (a,a,a,a) -> (b,b,b,b) -> (c,c,c,c)
zip4 f a b = fromList (zipWith f (toList a) (toList b))

main = do
  let a = (True, True, False, False)
  let b = (True, False, True, False)
  print $ apply_n_times (2 ^ 25) (zip4 xor a) b
```

It takes the pairwise xor of two quadruples 33 million times, taking `9` seconds to execute on my computer (compiled with `ghc --O2`). It is also stupid: `zip4 xor a (zip4 xor a (zip4 xor a ... b))` is always equal to `b` (for even applications). One may wonder: could a sufficiently smart compiler optimize it? Perhaps, but, before anything, it must be able to remove all abstractions used in `zip4`. Sadly, `zipWith` is known to scape Haskell's [short-cut fusion](https://wiki.haskell.org/Correctness_of_short_cut_fusion) for lists. Let's help the compiler by manually deforesting it:

```haskell
zip4 :: (a -> b -> c) -> (a,a,a,a) -> (b,b,b,b) -> (c,c,c,c)
zip4 f (ax,ay,az,aw) (bx,by,bz,bw) = (f ax bx, f ay by, f az bz, f aw bw)
```

Can GHC optimize it now? Well, no: this still takes `8.6` seconds on my computer. As you can see, the problem here is not deforestation, but the sheer amount of function calls. We could improve it by reasoning about the runtime execution; but that's a complex technique, and the very premise behind the field of [supercompilation](https://ghc.haskell.org/trac/ghc/wiki/Supercompilation).

But what about the [abstract algorithm](https://github.com/MaiaVictor/abstract-algorithm)? One of its most interesting aspects is sometimes running programs that "clearly shouldn't execute this fast". The first time I noticed this effect was in 2015, when the abstract algorithm was capable of computing the modulus of `(200^200)%13` encoded as a unary number. Such computation wouldn't fit a memory the size of the universe, yet the abstract algorithm had no trouble completing it. You can read about this on [Stack Overflow](https://stackoverflow.com/questions/31707614/why-are-%CE%BB-calculus-optimal-evaluators-able-to-compute-big-modular-exponentiation). This leads us to wonder how far can that algorithm go. What about `zip4`? Can it optimize it? Indeed. Mind the following λ-program:

```haskell
zip4 = λf. λa. λb. λtuple.
  (a λax. λay. λbz. λbw.
  (b λbx. λby. λbz. λbw.
   tuple (f ax bx) (f ay by) (f az bz) (f aw bw)))

main =
  let a = λtuple. tuple True True False False in
  let b = λtuple. tuple True False True False in
  apply_n_times (pow 2 25) (zip4 xor a) b
```

It is the exact equivalent of the second Haskell example, yet the abstract algorithm takes only `0.058` seconds to evaluate it. That is a 148x speedup against a 26-years-old state-of-art compiler, which isn't bad for a 200-LOC JavaScript compiler! But what about the first definition?

```haskell
zip4 = λf. λa. λb.
  fromList (zipWith f (toList a) (toList b))
```

This one is trickier. If you evaluate it as is, it will be exponential, too. But I've recently discovered an amazing technique that allows the definition to stay elegant and fast:

```haskell
zip4 = λf. λa. λb. λt.
  open a λa.
  open b λb.
  fromList (zipWith f (toList a) (toList b)) t
```

Here, `open` is a function that takes a 4-tuple (`T`), applies it to 4 newly-created variables (`λa. λb. λc. λd. T a b c d`), and then calls a continuation with that value. In other words, you just eta-expand it, describing the shape of an input variable; that is all it takes for the algorithm to fully "deforest" the definitions of `fromList`, `zipWith` and `toList`, no complex fusion strategy was needed! But what is truly remarkable about this technique is that it works for any function, no matter how high-level or recursive it is: as long you "open" all inputs, the optimal algorithm will be able to remove every single layer of abstraction it has, recovering an ultra-fast, low-level definition from your high-level specification; which is exactly what a supercompiler does! This allowed me to, for example, define a generic `zip` for `n-tuples` which is still optimal. Generic programming on λ-encoded data might be interesting.

## Brazillions of successors

Of course, `apply_n_times n (zip4 xor A)` is stupid; it does nothing. Mind the following, slightly more useful Haskell program:

```haskell
data Bin = O Bin | I Bin

succ :: Bin -> Bin
succ (O xs) = I xs
succ (I xs) = O (succ xs)

zero :: Bin
zero = O zero

main = putStrLn $ peek 64 (apply_n_times (2 ^ 63) succ zero)
```

Here, `succ` takes the successor of a binary string, so, `suc(0000) = 1000`, `suc(1000) = 0100`, `suc(0100) = 1100` and so on; nothing unusual. Now, printing the result of `apply_n_times (2 ^ 63) succ zero` must be obviously impossible, right? That'd require `9,223,372,036,854,775,808` calls to `succ`, which I estimate would take about `69,730` years on my computer (compiled with `ghc -O2`). But what if we implement the same algorithm in the λ-calculus? Can the abstract algorithm magically optimize it? Why not. The direct translation looks like:

```haskell
zero = /O zero
succ = λxs. λO. λI. xs I λxs. O (succ xs)
main = peek 64 (apply_n_times (pow 2 63) succ zero)
```

When executed, it correctly prints the result in `0.08` seconds. That is a `27,487,790,694,400x` speedup, which may be noticeable. Interestingly, but not surprisingly, changing the base makes the computation more expensive. Computing the first 8 bits of `3^255` takes 1 second, or `2,597,966` graph rewrites; which is fairly decent, given that doing the same in other languages would need at least

```
46,336,150,792,381,577,588,313,262,263,220,434,371,406,283,602,843,045,997,201,608,143,345,357,543,255,478,647,000,589,718,036,536,507,270,555,180,182,966,478,507
```

function calls.

## DIY

To replicate those experiments on your computer, install the `abstract-algorithm` module from npm:

```bash
npm i -g abstract-algorithm
```

And run `absal` on the `.lam` programs of this repository:

```bash
git clone https://github.com/maiavictor/articles
cd 0004-supercompilation-for-free

ghc -O2 test_a.hs -o test_a
time ./test_a

ghc -O2 test_b.hs -o test_b
time ./test_b

ghc -O2 test_c.hs -o test_c
time ./test_c

absal --stats --bruijn test_a
absal --stats --bruijn test_b
absal --stats --bruijn test_c
```

Alternatively, install Formality with:

```bash
npm i -g formality
```

And run:

```
fm -o test_a
```

Note those programs have a slightly uglier syntax than what I presented, as I wanted to have a very simple parser. Outputs are obviously λ-encoded, so you may need to understand those in order to interpret them.
