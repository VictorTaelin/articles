# Theorem proving VS testing VS auditing

On this article, I'll explain how theorem proving can be used as an alternative to testing and human auditing on the task of writing correct code.

## Implementing the code

When trying to find bugs in functions, the most widely adopted methods are auditing, and writing tests. For example, suppose that we wrote an "adder" function, which computes the addition of two bitstrings with a carry bit:

```haskell
data Bit = O | I deriving Show
type Bits = [Bit]

adder :: Bit -> Bits -> Bits -> Bits
adder O []       []       = []
adder O []       (O : ys) = O : adder O [] ys
adder O []       (I : ys) = I : adder O [] ys
adder O (O : xs) []       = O : adder O xs []
adder O (O : xs) (O : ys) = O : adder O xs ys
adder O (O : xs) (I : ys) = I : adder O xs ys
adder O (I : xs) []       = I : adder O xs []
adder O (I : xs) (O : ys) = I : adder O xs ys
adder O (I : xs) (I : ys) = O : adder I xs ys
adder I []       []       = I : []
adder I []       (O : ys) = I : adder O [] ys
adder I []       (I : ys) = O : adder I [] ys
adder I (O : xs) []       = I : adder O xs []
adder I (O : xs) (O : ys) = I : adder O xs ys
adder I (O : xs) (I : ys) = O : adder I xs ys
adder I (I : xs) []       = O : adder I xs []
adder I (I : xs) (O : ys) = I : adder O xs ys
adder I (I : xs) (I : ys) = I : adder I xs ys
```

## Auditing the code

One way to check if that function is correct is to audit it. That is a cool way to say we examine it carefully until we are convinced it is correct. Some do it profissionally, so, hiring them might be a good idea. I've looked it for some time and, while I'm a little bit sleepy, I didn't notice anything suspect, so I'm proud to claim the audit a success. Let's move on.

## Testing the code

Another way to improve our confidence is by actually testing the function. That means we run it and check if it returns what we expect. For example:

```haskell
main :: IO ()
main = print (adder [I,O,O,I] [O,I,I,O]) // prints [I,I,I,I]!
```

This program outputs `1111`, which is the sum of `1001 + 0110`, as expected. Great, but that isn't enough. To improve our rigor, we could create a `test` function, which compares our adder to the result of the native integer addition function:

```haskell
test :: Integer -> Integer -> Bool
test a b = to (adder O (from a) (from b)) == a + b where

  from :: Integer -> Bits
  from = go where
    go 0 = []
    go n | mod n 2 == 0 = O : go (div n 2)
         | otherwise    = I : go (div n 2)

  to :: Bits -> Integer
  to = go 1 where
    go :: Integer -> Bits -> Integer
    go k []        = 0
    go k (O : xs) = go (k * 2)  xs
    go k (I : xs) = k + go (k * 2)  xs
```

We could, then, use it to write a lot of unit tests:

```haskell
main :: IO ()
main = do
  print $ test 3 7
  print $ test 1 5
  print $ test 8 4
  print $ test 6 9
  print $ test 5 5
  print $ test 7 4
  print $ test 3 2
  print $ test 9 12
  print $ test 32 64
  print $ test 99 42
  print $ test 69 69
  print $ test 100 200
  print $ test 321 456
  print $ test 200 1239
  print $ test 256 1024
  print $ test 4096 7654
  print $ test 98765 10546
```

All the tests pass, so, I declare my tests as a success. Let's move on.

## Proving the code correct

Let's try something different now: instead of testing, let's try to **prove** our function correct. Can we? First, let's translate it to Agda:

```haskell
adder : Bit -> Bits -> Bits -> Bits
adder O []       []        = []
adder O []       (O ∷ ys)  = O ∷ adder O [] ys
adder O []       (I ∷ ys)  = I ∷ adder O [] ys
adder O (O ∷ xs) []        = O ∷ adder O xs []
adder O (O ∷ xs) (O ∷ ys)  = O ∷ adder O xs ys
adder O (O ∷ xs) (I ∷ ys)  = I ∷ adder O xs ys
adder O (I ∷ xs) []        = I ∷ adder O xs []
adder O (I ∷ xs) (O ∷ ys)  = I ∷ adder O xs ys
adder O (I ∷ xs) (I ∷ ys)  = O ∷ adder I xs ys
adder I []       []        = I ∷ []
adder I []       (O ∷ ys)  = I ∷ adder O [] ys
adder I []       (I ∷ ys)  = O ∷ adder I [] ys
adder I (O ∷ xs) []        = I ∷ adder O xs []
adder I (O ∷ xs) (O ∷ ys)  = I ∷ adder O xs ys
adder I (O ∷ xs) (I ∷ ys)  = O ∷ adder I xs ys
adder I (I ∷ xs) []        = O ∷ adder I xs []
adder I (I ∷ xs) (O ∷ ys)  = I ∷ adder O xs ys
adder I (I ∷ xs) (I ∷ ys)  = I ∷ adder I xs ys
```

Now, let's arbitrarily try to prove that `adder` commutes, as it should. For that, we must write the following function:


```haskell
adder-comm : forall x a b -> adder x a b ≡ adder x b a
```

This is a function that, for every bit `x`, and for all bitstrings `a` and `b`, returns a term of type `adder x a b ≡ adder x b a`. Writing a function of that type is the same as proving `adder` commutes, for reasons out of scope. But wtf is that type? Well, it is a type that, given the rules of Agda, can only be instantiated if the two sides of the equation are actually equal. What? Whatever, let's start our implementation by writing all the cases:

```haskell
adder-comm : forall x a b -> adder x a b ≡ adder x b a
adder-comm O []      []      = ?
adder-comm O []      (O ∷ b) = ?
adder-comm O []      (I ∷ b) = ?
adder-comm O (O ∷ a) []      = ?
adder-comm O (I ∷ a) []      = ?
adder-comm O (O ∷ a) (O ∷ b) = ?
adder-comm O (O ∷ a) (I ∷ b) = ?
adder-comm O (I ∷ a) (O ∷ b) = ?
adder-comm O (I ∷ a) (I ∷ b) = ?
adder-comm I []      []      = ?
adder-comm I []      (O ∷ b) = ?
adder-comm I []      (I ∷ b) = ?
adder-comm I (O ∷ a) []      = ?
adder-comm I (I ∷ a) []      = ?
adder-comm I (O ∷ a) (O ∷ b) = ?
adder-comm I (O ∷ a) (I ∷ b) = ?
adder-comm I (I ∷ a) (O ∷ b) = ?
adder-comm I (I ∷ a) (I ∷ b) = ?
```

We've been implementing functions for our entire lives. Implementing this one can't be that hard, can it? In fact, it is almost complete. The only new thing here is returning a term of type `adder x a b ≡ adder x b a`. But how?

One of the cool things about Agda is that it allows us to ask the type of a hole. If we, thus, ask for the type of any of those `?`s, we should see `adder x a b ≡ adder x b a`, right? After all, that's what I just said we are trying to return! Right? Well, no. If we ask the type of the first one, this is what we see:

```haskell
[] ≡ []
```

But why? That's different from the return type of the function. Because Agda substituded `x`, `a` and `b` by `O`, `[]` and `[]`, which are the concrete values of those variables on the first case. This causes the type to reduce from:

```haskell
adder x a b ≡ adder x a b
```

To:

```haskell
adder O [] [] ≡ adder O [] []
```

To:

```haskell
[] ≡ []
```

Which is simpler. But, again, how the hell do we instantiate a term of type `[] ≡ []`? Well, Agda has this cool function called `refl` which, for any term `x`, returns a term of type `x ≡ x`. Or, in other words: *"any term is equal to itself"*. Can we, thus, just use `refl` there? Yes, we can:

```haskell
adder-comm : forall x a b -> adder x a b ≡ adder x b a
adder-comm O []      []      = refl {x = []}
adder-comm O []      (O ∷ b) = ?
adder-comm O []      (I ∷ b) = ?
adder-comm O (O ∷ a) []      = ?
adder-comm O (I ∷ a) []      = ?
adder-comm O (O ∷ a) (O ∷ b) = ?
adder-comm O (O ∷ a) (I ∷ b) = ?
adder-comm O (I ∷ a) (O ∷ b) = ?
adder-comm O (I ∷ a) (I ∷ b) = ?
adder-comm I []      []      = ?
adder-comm I []      (O ∷ b) = ?
adder-comm I []      (I ∷ b) = ?
adder-comm I (O ∷ a) []      = ?
adder-comm I (I ∷ a) []      = ?
adder-comm I (O ∷ a) (O ∷ b) = ?
adder-comm I (O ∷ a) (I ∷ b) = ?
adder-comm I (I ∷ a) (O ∷ b) = ?
adder-comm I (I ∷ a) (I ∷ b) = ?
```

What? OK, if that didn't make any sense to you, don't worry, it is hard to grasp `refl` on the first try. Not because it is complex, it is just different. The point is, I managed to implement the first case, because:

1. Agda allowed me to, on that case, return a term of type `[] ≡ []`, instead of `adder x a b ≡ adder x b a`, because it substituted the variables by the concrete values of that case.

2. Agda has a magic function called `refl` which, for any term `x`, returns a term of type `x ≡ x`.

3. I called `refl {x = []}`, which gave me a term of type `[] ≡ []`.

4. I returned it, because that is what I needed to return!

In English-math terms, what I did is the equivalent of saying: *"if `x` is `O`, and `a` and `b` are empty, then, `adder x a b` reduces to `[]`, and `adder x b a` also reduces to `[]`... those are syntactically equal (`refl`), thus, for that case, `adder x a b ≡ adder x b a`"*.

Ok, let's move on and check the type of the second hole.

```haskell
O ∷ adder O [] b ≡ O ∷ adder O b []
```

This time, Agda substituted the variables `x`, `a` and `b` by `O`, `[]` and `(O :: b)`, again their concrete values on that case. But, now, it didn't reduce to a type that is obviously equal. If we write:

```
refl {x = O ∷ adder O [] b}
```

We'll have a term of type:

```
O ∷ adder O [] b ≡ O ∷ adder O [] b
```

Which is not what we need to return: notice the position of `b`. The so magical "refl" won't help us this time. What now? Again, we need to build a term of type `O ∷ adder O [] b ≡ O ∷ adder O b []`. Let's try the following:

```haskell
adder-comm : forall x a b -> adder x a b ≡ adder x b a
adder-comm O []      []      = refl {x = []}
adder-comm O []      (O ∷ b) = let rec = adder-comm O [] b in ?
adder-comm O []      (I ∷ b) = ?
adder-comm O (O ∷ a) []      = ?
adder-comm O (I ∷ a) []      = ?
adder-comm O (O ∷ a) (O ∷ b) = ?
adder-comm O (O ∷ a) (I ∷ b) = ?
adder-comm O (I ∷ a) (O ∷ b) = ?
adder-comm O (I ∷ a) (I ∷ b) = ?
adder-comm I []      []      = ?
adder-comm I []      (O ∷ b) = ?
adder-comm I []      (I ∷ b) = ?
adder-comm I (O ∷ a) []      = ?
adder-comm I (I ∷ a) []      = ?
adder-comm I (O ∷ a) (O ∷ b) = ?
adder-comm I (O ∷ a) (I ∷ b) = ?
adder-comm I (I ∷ a) (O ∷ b) = ?
adder-comm I (I ∷ a) (I ∷ b) = ?
```

So, what did happen? We just called `adder-comm` recursively with the arguments `O`, `[]` and `(O :: b)`. That returned a term, `rec`, of type:

```haskell
rec : adder O [] b ≡ adder O b []
```

How? Well, notice the function `adder-comm` (which we are defining) returns a term of type `adder x a b ≡ adder x b a`, so we used it on `O`, `[]` and `b` to get a term of type `adder O [] b ≡ adder O b []`. Can we do that? Yes, we can, in the same way that we can call functions recursively in Haskell. That's called the induction hypothesis.

Now we have a term, `rec`, with a type that is surprisingly close to what we need to return:


```haskell
O ∷ adder O [] b ≡ O ∷ adder O b []
```

The only difference is that there is an extra `O ∷` on each side. What now? Well, Agda has another nice function called `cong`, with the following type:

```haskell
cong : {x y : A} → (f : A → B) → x ≡ y → f x ≡ f y
```

Or, in other words, it allows us to take a term of type `x ≡ y`, and return a term of type `f x ≡ f y`, for any `f`. If we apply `λ x -> O :: x` to both sides of the type of `rec`, then we get a term of type:

```haskell
O ∷ adder O [] b ≡ O ∷ adder O b []
```

Which is exactly the type we needed! We can, thus, complete that case by applying `cong` to `rec`. In fact, we can apply the same technique and keep filling all the cases below it:

```haskell
adder-comm : forall x a b -> adder x a b ≡ adder x b a
adder-comm O []      []      = refl {x = []}
adder-comm O []      (O ∷ b) = cong (λ x → O ∷ x) (adder-comm O [] b)
adder-comm O []      (I ∷ b) = cong (λ x → I ∷ x) (adder-comm O [] b)
adder-comm O (O ∷ a) []      = cong (λ x → O ∷ x) (adder-comm O a [])
adder-comm O (I ∷ a) []      = cong (λ x → I ∷ x) (adder-comm O a [])
adder-comm O (O ∷ a) (O ∷ b) = cong (λ x → O ∷ x) (adder-comm O a b)
adder-comm O (O ∷ a) (I ∷ b) = cong (λ x → I ∷ x) (adder-comm O a b)
adder-comm O (I ∷ a) (O ∷ b) = cong (λ x → I ∷ x) (adder-comm O a b)
adder-comm O (I ∷ a) (I ∷ b) = cong (λ x → O ∷ x) (adder-comm I a b)
adder-comm I []      []      = refl {x = []}
adder-comm I []      (O ∷ b) = cong (λ x → I ∷ x) (adder-comm O [] b)
adder-comm I []      (I ∷ b) = cong (λ x → O ∷ x) (adder-comm I [] b)
adder-comm I (O ∷ a) []      = cong (λ x → I ∷ x) (adder-comm O a [])
adder-comm I (I ∷ a) []      = cong (λ x → O ∷ x) (adder-comm I a [])
adder-comm I (O ∷ a) (O ∷ b) = cong (λ x → I ∷ x) (adder-comm O a b)
adder-comm I (O ∷ a) (I ∷ b) = ?
adder-comm I (I ∷ a) (O ∷ b) = ?
adder-comm I (I ∷ a) (I ∷ b) = ?
```

Cool, isn't it? But there is a problem with the 3rd-last case. If we ask for the type of its hole, we get:

```haskell
O ∷ adder I a b ≡ I ∷ adder O b a
```

Here, the induction hypothesis won't help. Even if we could call `adder-comm` recursively to get a term of type `adder I a b ≡ adder O b a`, there would be no way to turn it into `O ∷ adder I a b ≡ I ∷ adder O b a`. The problem is that each side has a list which starts with a different bit. So, what can we do to complete that clause? Nothing! There is no function in Agda that helps us here, because, guess what? Our function is **not** commutative. We've found a bug! How could that be? Let's check the corresponding clauses:

```haskell
adder I (O ∷ xs) (I ∷ ys)  = O ∷ adder I xs ys
adder I (I ∷ xs) (O ∷ ys)  = I ∷ adder O xs ys
```

There is our mistake: on the `1 + 1 + 0` case, we return `1`, with a carry bit `0`, whereas we should return `0`, with a carry bit `1`! Let's fix it:

```haskell
adder : Bit -> Bits -> Bits -> Bits
adder O []       []        = []
adder O []       (O ∷ ys)  = O ∷ adder O [] ys
adder O []       (I ∷ ys)  = I ∷ adder O [] ys
adder O (O ∷ xs) []        = O ∷ adder O xs []
adder O (O ∷ xs) (O ∷ ys)  = O ∷ adder O xs ys
adder O (O ∷ xs) (I ∷ ys)  = I ∷ adder O xs ys
adder O (I ∷ xs) []        = I ∷ adder O xs []
adder O (I ∷ xs) (O ∷ ys)  = I ∷ adder O xs ys
adder O (I ∷ xs) (I ∷ ys)  = O ∷ adder I xs ys
adder I []       []        = I ∷ []
adder I []       (O ∷ ys)  = I ∷ adder O [] ys
adder I []       (I ∷ ys)  = O ∷ adder I [] ys
adder I (O ∷ xs) []        = I ∷ adder O xs []
adder I (O ∷ xs) (O ∷ ys)  = I ∷ adder O xs ys
adder I (O ∷ xs) (I ∷ ys)  = O ∷ adder I xs ys
adder I (I ∷ xs) []        = O ∷ adder I xs []
adder I (I ∷ xs) (O ∷ ys)  = O ∷ adder I xs ys
adder I (I ∷ xs) (I ∷ ys)  = I ∷ adder I xs ys
```

Can we complete `adder-comm` now? Sure:

```haskell
adder-comm : forall x a b -> adder x a b ≡ adder x b a
adder-comm O []      []      = refl {x = []}
adder-comm O []      (O ∷ b) = cong (λ x → O ∷ x) (adder-comm O [] b)
adder-comm O []      (I ∷ b) = cong (λ x → I ∷ x) (adder-comm O [] b)
adder-comm O (O ∷ a) []      = cong (λ x → O ∷ x) (adder-comm O a [])
adder-comm O (I ∷ a) []      = cong (λ x → I ∷ x) (adder-comm O a [])
adder-comm O (O ∷ a) (O ∷ b) = cong (λ x → O ∷ x) (adder-comm O a b)
adder-comm O (O ∷ a) (I ∷ b) = cong (λ x → I ∷ x) (adder-comm O a b)
adder-comm O (I ∷ a) (O ∷ b) = cong (λ x → I ∷ x) (adder-comm O a b)
adder-comm O (I ∷ a) (I ∷ b) = cong (λ x → O ∷ x) (adder-comm I a b)
adder-comm I []      []      = refl {x = []}
adder-comm I []      (O ∷ b) = cong (λ x → I ∷ x) (adder-comm O [] b)
adder-comm I []      (I ∷ b) = cong (λ x → O ∷ x) (adder-comm I [] b)
adder-comm I (O ∷ a) []      = cong (λ x → I ∷ x) (adder-comm O a [])
adder-comm I (I ∷ a) []      = cong (λ x → O ∷ x) (adder-comm I a [])
adder-comm I (O ∷ a) (O ∷ b) = cong (λ x → I ∷ x) (adder-comm O a b)
adder-comm I (O ∷ a) (I ∷ b) = cong (λ x → O ∷ x) (adder-comm I a b)
adder-comm I (I ∷ a) (O ∷ b) = cong (λ x → O ∷ x) (adder-comm I a b)
adder-comm I (I ∷ a) (I ∷ b) = cong (λ x → I ∷ x) (adder-comm I a b)
```

If we compile the program above, we get no type error, which means we successfully proved `adder` commutes! Yay!


## Conclusion

By trying to prove a property we expected to hold on `adder`, the compiler naturally guided us to finding a bug; a bug that passed unnoticed through all tests! Did we prove the function correct? No, because... *"define what correct means"*! But we've proven a property which we expect from any correct implementation of `add`. If we wanted a stronger proof, we could implement this function:

```haskell
adder-adds : forall a b -> to (adder O (from a) (from b)) = a + b
```

Which is equivalent to the tests we did comparing `adder` to the built-in `add` function, except this time it'd be a proof rather than just tests. We could, similarly, prove any arbitrary specification of what we consider to be a correct implementation of "add".

## Relevance to smart-contracts

Now, you might think: "if we wrote more tests, we'd have spotted that one too!" True, but that's a pretty simple function. Now, think of something much more complex, like:

```haskell
contract-is-undrainable : forall txs -> balance (EVM-apply txs (EMV-deploy bytecode)) > 0
contract-is-undrainable = ...
```

The type of that function says that, no matter what transactions certain contract receives, its balance will never fall to zero. That is a nice property to have in a contract that must be undrainable. You could write as many tests as you want, but you'd never be 100% certain your contract ins undrainable. A proof gives 100% certainty.

That is, IMO, how we will begin trusting smart-contracts that deal with a ton of money. Rather than doing several auditions and writing lots of tests (like we did with TheDAO), we'll, instead, ask for the developers to prove that the contract satisfies certain expectations, which are expressed as specifications (types) that are much easier to read than the code of the contract itself.

---

(edit)

This is, by the way, a much simpler implementation:

```agda
inc : {n : Nat} -> Bits n -> Bits n
inc []       = []
inc (O ∷ xs) = I ∷ xs
inc (I ∷ xs) = O ∷ inc xs

add : {n : Nat} -> Bits n -> Bits n -> Bits n
add []       []       = []
add (O ∷ xs) (O ∷ ys) = O ∷ (add xs ys)
add (O ∷ xs) (I ∷ ys) = I ∷ (add xs ys)
add (I ∷ xs) (O ∷ ys) = I ∷ (add xs ys)
add (I ∷ xs) (I ∷ ys) = inc (I ∷ (add xs ys))

add-comm : {n : Nat} -> (a : Bits n) -> (b : Bits n) -> add a b ≡ add b a
add-comm []       []       = refl
add-comm (O ∷ xs) (O ∷ ys) = cong O∷ (add-comm xs ys)
add-comm (O ∷ xs) (I ∷ ys) = cong I∷ (add-comm xs ys)
add-comm (I ∷ xs) (O ∷ ys) = cong I∷ (add-comm xs ys)
add-comm (I ∷ xs) (I ∷ ys) = cong O∷ (cong inc (add-comm xs ys))
```

Guess my skills are slighly above they were before on this seemingly infinite stairway.
