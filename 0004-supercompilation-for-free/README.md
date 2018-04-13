## Supercompilation for free on the abstract algorithm

The [abstract-algorithm](https://github.com/MaiaVictor/abstract-algorithm) is how I call a very simple (~200 LOC!), elegant abstract machine that evaluates λ-calculus terms optimally. With this article, I'll show 2 small experiments in which my 200-LOC JavaScript evaluator beats GHC (The Glorious Glasgow Haskell Compiler) by a few orders of magnitude.

### zipWith tuples

Observe the following program:

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

It takes the pairwise xor of two quadruples 33 million times. As such, it is obviously slow, taking `9` seconds to execute on my computer, compiled with `ghc --O2`. But if we reason about it, that program is stupid: `zip4 xor a (zip4 xor a (zip4 xor a ... b))` is always equal to `b` when there is an even numbers of xors. Could a sufficiently smart compiler optimize that? Well, for one, it must be able to remove all abstractions used in `zip4`. Sadly, `zipWith` is known to scape Haskell's [short-cut fusion](https://wiki.haskell.org/Correctness_of_short_cut_fusion) for lists. Let's help GHC by manually deforesting it:

```haskell
zip4 :: (a -> b -> c) -> (a,a,a,a) -> (b,b,b,b) -> (c,c,c,c)
zip4 f (ax,ay,az,aw) (bx,by,bz,bw) = (f ax bx, f ay by, f az bz, f aw bw)
```

Can GHC optimize it now? Well, no: this still takes `8.6` seconds on my computer. The problem here is not deforestation, but the sheer amount of function calls, so no regular optimization can improve it further. Perhaps if we started to reason about the runtime execution; that's the premise behind the field of [supercompilation](https://ghc.haskell.org/trac/ghc/wiki/Supercompilation), but it is a very complex technique. 

What about the [optimal algorithm](https://github.com/MaiaVictor/abstract-algorithm)? I've been for long observing bizarre behavior on programs that "clearly shouldn't execute this fast". The first time I noticed effect was in 2015, when the optimal algorithm was capable of computing the modulus of `(200^200)%13` encoded as a unary number. Such computation wouldn't fit a memory the size of the universe, yet the optimal algorithm had no trouble completing it. You can read about this on [Stack Overflow](https://stackoverflow.com/questions/31707614/why-are-%CE%BB-calculus-optimal-evaluators-able-to-compute-big-modular-exponentiation).

Unsurprisingly, `zip4` is yet another instance that is magically optimized by the abstract-algorithm. The following program:

```haskell
zip4 = λf. λa. λb. λtuple.
  (a λax. λay. λbz. λbw.
  (b λbx. λby. λbz. λbw.
   tuple (f ax bx) (f ay by) (f az bz) (f aw bw)))

main =
  let a = λtuple. tuple True True False False
  let b = λtuple. tuple True False True False
  print $ apply_n_times (pow 2 25) (zip4 xor a b)
```

It is the exact equivalent of the second Haskell example, yet my JavaScript algorithm takes only `0.058` seconds to evaluate it. That is a 148x speedup, which isn't bad! But what about the first definition?

```haskell
zip4 = λf. λa. λb.
  fromList (zipWith f (toList a) (toList b))
```

This one is trickier. If you evaluate it as is, it will be exponential, too. But I've recently discovered an amazing technique that allows the definition to stay almost as elegant:

```haskell
zip4 = λf. λa. λb. λt.
  (open a λa.
  (open b λb.
  fromList (zipWith f (toList a) (toList b)) t))
```

Here, `open` is a function that takes a 4-tuple (`T`), applies it to 4 newly-created variables (`λa. λb. λc. λd. T a b c d`), and then calls a continuation with that value. Doing that allows the algorithm to fully reduce the definitions of `fromList`, `zipWith` and `toList`, making it as fast as the former. What is truly remarkable about this technique is that it generalizes to any kind of function. No matter how high-level is your implementation, as long as you open your inputs, the optimal evaluator will be able to remove every single layer of abstraction and recover an ultra-fast low-level definition; which is exactly what a supercompilator does!

### Brazillions of successors

Of course, `zip4` is stupid. This wouldn't work for programs that actually compute somethinng, right? Wrong. Mind the following Haskell program:

```haskell
data Bin = O Bin | I Bin

succ :: Bin -> Bin
succ (O xs) = I xs
succ (I xs) = O (succ xs)

zero :: Bin
zero = O zero

main = putStrLn $ peek 64 (apply_n_times (2 ^ 63) succ zero)
```

Here, `succ` takes the successor of a binary string, so, `suc(0000) = 1000`, `suc(1000) = 0100`, `suc(0100) = 1100` and so on; nothing unusual. Now, printing the result of `call_n_times (2 ^ 63) zero` must be obviously impossible, right? That'd require `9223372036854775808` calls to `succ`, which I estimate would take about 69,730 years on my computer (compiled with `ghc -O2`). But what if we implement the same algorithm in the λ-calculus? Can the abstract algorithm magically optimize it? Why not. The direct translation looks like:


```haskell
zero = /O B0
succ = λxs. λO. λI. xs I λxs. O (succ xs)
main = peek 64 (apply_n_times (pow 2 63) succ zero)
```

When executed, it correctly prints the result in `0.08` seconds. That is a `27,487,790,694,400x` speedup, which may be noticeable. Interestingly, but not surprisingly, changing the base makes the computation more expensive. Computing the first 8 bits of `3^255` takes 1 second, or `2,597,966` graph rewrites; which is fairly decent, given that doing the same in other languages would need at least

```
46,336,150,792,381,577,588,313,262,263,220,434,371,406,283,602,843,045,997,201,608,143,345,357,543,255,478,647,000,589,718,036,536,507,270,555,180,182,966,478,507
```

function calls.

### DIY

To replicate those experiments on your computer, install the `abstract-algorithm` module from npm:

```bash
npm i -g abstract-algorithm
```

And run `absal` it on the `.lam` programs of this repository:

```bash
git clone https://github.com/maiavictor/articles
cd 0005-supercompilation-behavior-on-optimal-evaluator

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

Note those programs have a slightly uglier syntax than what I presented, as I wanted to have a very simple parser. Outputs are obviously λ-encoded, so you may need to understand those in order to interpret them.