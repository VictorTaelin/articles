### observe-in: a simple primitive for dependent pattern matching on CoC?

The [Calculus of Constructions](https://en.wikipedia.org/wiki/Calculus_of_constructions) is a type theory that serves both as a programming language and as a consturctive foundation of mathematics. If you know the untyped lambda calculus, you're aware it is an extremelly simple language capable of [elegantly expressing](https://github.com/MaiaVictor/caramel) any program you'd write in Haskell, Scheme, ML and the like. CoC is its typed counterpart: it is, too, a very simple language, yet powerful enough to express any complex type you'd write on Idris, Coq, Agda and the like. Or so we'd wish: in reality, it can't express important types such as induction, which is necessary to prove most everyday theorems.

### The problem

I'll be using [Morte](https://github.com/Gabriel439/Haskell-Morte-Library)'s syntax for my CoC examples. Consider the following term:

```idris
natInduction =
  ∀ (P : Nat -> *) ->
  ∀ (S : (n : Nat) -> P n -> P (Succ n)) ->
  ∀ (Z : P Zero) ->
  ∀ (n : Nat) ->
  P n
```

It has been proven that, no matter what choice of `Nat : Type`, `Succ : Nat -> Nat` and `Z : Nat`, you can't implement `natInduction` on CoC. In human terms, that means that, given a theorem indexed on nats (example: *"for all nat n, there is a list of length n"*), a base case (example: *"the empty list has length zero"*) and a function that, given a proof of that theorem for a number `n`, returns a proof of that theorem for number `n + 1` (example: *"given a list of length n, `0 :: list` is a list of length `n + 1`"*), we can't conclude that the theorem is true. Not only that, you can't prove that addition commutes or is associative, you can't work with vectors with bounded sizes, you can't even extract the second element of dependent pairs. In short, CoC can't prove many theorems that are essential for everyday maths and programming.

### Existing solutions

The solution used by Coq and other proof assistants is to extend CoC with native inductive types. That means a datatype system similar to Haskell's, except with dependent types. Things like that:

```idris
-- Similar as Haskell/Elm/OCaml "data" statement, but with richer type annotations
data Vect : (len : Nat) -> (elem : Type) -> Type where
  VNil  : Vect Zero
  VCons : elem -> Vect len elem -> Vect (Succ len) elem
```

Those, together with dependent pattern matching...

```idris
case n returns P n where
  Zero       => VNil            
  VCons x xs => VCons x (rec xs)
```

... gives the language the ability to prove a lot of things about its data-structures, inclusive the induction principle.

The problem is that implementing inductive types [is complex](https://i.imgur.com/EcSA7OV.png). If you could, for example, implement CoC in 300 lines, you'd need perhaps 5x that to implement inductive types. That makes it harder to reason about the core language, to prove properties about it, and, mostly, to have more independent implementations, which is important if we want, for example, to have a standard. This has motivated researchers to look for simpler extensions that are equally as expressive. One relevant insight is the fact that CoC already has means of expressing datatypes. For example, the following Idris type:

```idris
data Nat : Type where
  Succ : Nat -> Nat
  Zero : Nat
```

Can be expressed on CoC as:

```idris
Nat  =                ∀ (P : *) -> ∀ (S : P -> P) -> ∀ (Z : P) -> P
Succ = λ (n : Nat) -> λ (P : *) -> λ (S : P -> P) -> λ (Z : P) -> S (n P S Z)
Zero =                λ (P : *) -> λ (S : P -> P) -> λ (Z : P) -> Z
```

Anything you could express with an Idris `data` statement could be expressed on CoC in a similar way. The hope is that, by reusing the datatype system that CoC naturally has, we could figure out a simpler extension that gave it the ability to express induction on those, without needing to hardcode a whole datatype system as a primitive. This is Aaron Stump's approach on the [Self Types for Dependently Typed Lambda Encodings](https://fermat.github.io/document/papers/rta-tlca.pdf) paper. There, he extends CoC with a primitive called `self`, which allows a type to refer to its own typed value. That way, induction could be expressed as:

```
Nat  =          ι x . ∀ (P : Nat -> *) -> ∀ (S : ∀ (k : Nat -> P k -> P (Succ k))) -> (Z : P Zero) -> P x
Zero =                λ (P : Nat -> *) -> λ (S : ∀ (k : Nat -> P k -> P (Succ k))) -> (Z : P Zero) -> Z
Succ = λ (n : Nat) -> λ (P : Nat -> *) -> λ (S : ∀ (k : Nat -> P k -> P (Succ k))) -> (Z : P Zero) -> S n (n P S Z)
ind  =                                    λ (S : ∀ (k : Nat -> P k -> P (Succ k))) -> (Z : P Zero) -> λ (n : Nat) -> n P S Z
```

The trick here is the new construct, `ι x . T`, which allows the type of `T` to refer to its typed term. Notice, on the 4th line, `n : Nat`, which starts with `ι x`. That allows us to replace `x` by `n`, resulting in `n : ∀ (P : Nat -> *) -> ∀ (S : ∀ (k : Nat -> P k -> P (S k))) -> (Z : P Zero) -> P n`. If we then proceed to type check its body, we'll realize `n P S Z : P n`, which means `ind : λ (S : ∀ (k : Nat -> P k -> P (S k))) -> (Z : P Zero) -> λ (n : Nat) -> P n`, which is exactly what we wanted to have!

There are a few problems with this approach, though. First, notice how those definitions are mutually recursive. `Nat` depends on `Succ` which depends on `Nat`. So, this isn't really CoC, but CoC + mutual recursive definitions, which can be complex to define properly. Second, this only allows proving induction for indexed Nat type (i.e., Parigot encoding), which is very complex. The author claims those can be erased to the Church encoding, but that requires even more primitives, and doesn't make the datatype less complex to the end-user. Languages such as Idris allow you to reason inductivelly about simple datatypes such as `data Nat = S Nat | Z`. Third, it does feel (although I could be wrong) that this isn't really general: it looks like a hack to type this very specific kind of term, rather than a solution to the underlying issues that causes it not to be typeable to begin with.

Aaron has a follow-up work called [The Calculus of Dependent Lambda Eliminations](http://homepage.cs.uiowa.edu/~astump/papers/cedille-draft.pdf). While I haven't researched it deeply enough to comment meaningfully, I do understand it is a more powerful version, but has several additional constructors not present on CoC. Induction is, I believe, proven by proving two terms are identical after erasure, and allowing one to use the value of the other on its typing, and more things are possible. In any case, while it is not that complex, it is certainly not that simple too.

### Proposed solution: dependent pattern matching with observe-in primitive

If we start wondering what, precisely, is missing on CoC that prevents it to express interesting proofs, then, dependent pattern matching could be a good place to look. For example, the following Idris term:

```idris
boolInduction : (P : Bool -> *) -> (T : P True) -> (F : P False) -> (b : Bool) -> P b
boolInduction b = case b of { True => T; False => F }
```

uses dependent pattern-matching to prove the inductive principle for Bool. Can we prove that on CoC? I believe not. Consider this attempt:


```idris
Bool  = ∀ (P : *) -> ∀ (T : P) -> ∀ (F : P) -> P
True  = λ (P : *) -> λ (T : P) -> λ (F : P) -> T
false = λ (P : *) -> λ (T : P) -> λ (F : P) -> F

boolInduction =
  λ (P : * -> Bool) ->
  λ (T : P True) ->
  λ (F : P False) ->
  λ (b : Bool) ->
  b (P b) T F
```

Interestingly, that doesn't type-check, because the second argument of `b (P b) T F` should be of type `P b`, but has type `P True`, and the second should be of type `P b`, but has type `P False`. So, the problem doesn't seem to be related to recursion: CoC is already not expressive enough to prove induction for simple, non-recursive datatypes! But why the same thing works on Idris? Well, because of how dependent pattern-matching works. The trick is that, in an expression such as:

```idris
case b of
  True  => T
  False => F
```

The first branch has type `T True`, the second branch has type `T False`, yet the whole expression has type `P b`. In other words, Idris allows us to conclude `P b` holds, if we have a proof of `P True` and `P False`. On CoC that is not possible. When we pattern-match against a lambda-encoded datatype, we must chose the return type. If we chose, for example, `P b` as the return type and then return `P True` on the first branch, that'll be a type error, because the variable `b` is different from the term `True`, even if we know for sure that, on that branch, `b` can only be `True`! So, this is what seems to be missing on CoC: the ability to understand that a variable can only have certain more refined values inside certain branches. To solve that, I suggest the following primitive:

```idris
obs x = y in z
```

It has a simple effect. First, it replaces all occurences of `x` by `y` on the expression it was bound, `F`. If the result is equal to `z`, then that expression has type `F(x)`. And that's it! Or, to be more precise, this is how we check the type of `obs x = y in z`:

```idris
ty ctx (Obs x y z) False = do
  -- Checks if replacing `x` by `y` on its bound expression's value has `z`'s value
  y_nf <- nf ctx y
  z_nf <- nf ctx z
  r_nf <- subs y_nf (nf ctx (binder ctx x))
  when (!matches(z_nf, r_nf))
    return $ Error "Incorrect observation value: ..."

  -- Checks if replacing `x` by `y` on its bound expression's type has `z`'s type
  y_ty <- ty ctx y False
  z_ty <- ty ctx z False
  r_ty <- subs y_nf (ty ctx (binder ctx x) True)
  when (!matches(z_nf, r_nf))
    return $ Error "Incorrect observation type: ..."

  -- If so, this must be a sub-case of a pattern-matched λ-encoded datatype,
  -- thus, we allow the type of this sub-case to be the type of the whole
  return $ subs x (ty ctx (binder ctx x))

ty ctx (Obs x y z) True = ty ctx z True

nf ctx (Obs x y z) = nf ctx z
```

### Examples

With `observe-in`, we could implement bool induction as such: 

```idris
boolInduction =
  λ (P : * -> Bool) ->
  λ (T : P True) ->
  λ (F : P False) ->
  λ (b : Bool) ->
  b (P b)
    obs b = True in T
    obs b = False in F
```

This works, because replacing `b` by `True` on its bound expression, it reduces to `T`, which is exactly what is returned by `obs b = True in T`. Moreover, replacing `b` by `True` on its bound expression has type `P True`, which is exactly the type returned by `obs b = True in T`. As such, the type of this expression is the type of the bound expression introducing its bound variable, which is `P b`. The whole thing, thus, has type `∀ (P : * -> Bool) -> ∀ (T : P True) -> ∀ (F : P False) -> λ (b : Bool) -> P b`, which is what we wanted!

The key insight here is that, on the `T` branch, `b` can only be `True`. Again, we know that, but CoC doesn't. The `obs x = y in z` gives us the ability to tell it that. We can, in other words, claim a variable has a refined value in an expression. The compiler checks if we're correct (by normalizing the original bounding expression with the due substitution) and, if we are, it uses that information on the checking procedure. So, what else can we do with that? A lot, it seems. For example, we can't also extract the second element of sigma on CoC. Can we do that with `observe-in`? Sure:


```idris
Sigma =
  λ (A : *) ->
  λ (B : A -> *) ->
  ∀ (P : *) ->
  ∀ (MkSigma : ∀ (a : A) -> ∀ (b : B a) -> P) ->
  P

MkSigma =
  λ (A : *)
  λ (B : A -> *) ->
  λ (a : A) ->
  λ (b : B a) ->
  λ (P : *) ->
  λ (MkSigma : ∀ (a : A) -> ∀ (b : B a) -> P) ->
  MkSigma a b

fst =
  λ (A : *) ->
  λ (B : A -> *) ->
  λ (s : Sigma A B) ->
  s A (λ (a : A) -> λ (b : B a) -> a)

snd =
  λ (A : *) ->
  λ (B : A -> *) ->
  λ (s : Sigma A B) ->
  s (B (fst A B s)) ->
    λ (a : A) ->
    λ (b : B a) ->
    obs s = MkSigma A B a b
    in  b
```

Notice the use of `observe-in` on `snd`: it states the fact that, after pattern-matching `s`, it must be on the form `MkSigma A B a b`. The compiler checks that indeed holds and the whole expression magically returns `B (fst A B s)`, which is exactly the type returned by `snd`.

What about Nat? Can we do it now? No. The problem is that Nat is a recursive type, and we don't have those yet. That seems to be a separate issue. Assume, though, we further extended CoC to allow recursive definitions. Could we, then, do it? Sure:

```idris
Nat  =                ∀ (P : *) -> ∀ (Z : P) -> ∀ (S : Nat -> P) -> P
Succ = λ (n : Nat) -> λ (P : *) -> λ (Z : P) -> λ (S : Nat -> P) -> S n
Zero =                λ (P : *) -> λ (Z : P) -> λ (S : Nat -> P) -> Z

natInduction =
  λ (P : Nat -> *) ->
  λ (Z : P Zero) ->
  λ (S : ∀ (n : Nat) -> P n -> P (Succ n)) ->
  λ (n : Nat) ->
  n (P n) 
    obs n = Zero in Z
    λ (pred : Nat) ->
      obs n = Succ pred
      in  S pred (natInduction P Z S pred)
```

Notice there is no mutual recursion nor anything more complex. The only times recursion is used here is on `Nat`, to encode `data Nat = Zero | Succ Nat` (which is equivalent to Haskell: notice how much simpler it is than the one using self types!), and on `natInduction`, to recurse over a structurally smaller term, which can be verified by the fact `pred` is a sub-part of an observed value. Both things are safe. On `natInduction`, `observe-in` is used to assert that we know `n` is `Zero` on the first branch, and that it is `Succ pred` on the second branch. Everything checks and the resulting term has type `∀ (P : Nat -> *) -> P Zero -> (∀ (n : Nat) -> P n -> P (Succ n)) -> ∀ (n : Nat) -> P n`, which is exactly the induction principle on Nats, as we wanted.

### Conclusion

I noticed extending CoC with a seemingly simple and natural primitive, `observe-in`, seems to give it the ability to perform dependent pattern matching on simple lambda-encoded terms, enabling you to express Coq-like proofs (such as induction) without the need for built-in inductive types. Now I wonder if this is something known, if there is any problem with this approach, and if the resulting language is consistent. Chances are I'm missing some issue that causes non-termination. If there's not anything obvious, though, then answering that question would be the next step.
