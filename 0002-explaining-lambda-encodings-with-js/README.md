Lambda encodings allow you to express Haskell algebraic datatypes in any language with closures. Here I'll explain them without many words, mostly examples. Carefully observe how one translates to the other and you'll get it.

## Booleans

For non-recursive data-types, Church-encoding == Scott-encodding.

- Haskell

```haskell
data Bool' = True' | False' deriving Show

and' a b = case a of
  True' -> b
  False' -> False'

or' a b = case a of
 True' -> True'
 False' -> b

xor' a b = case a of
  False' -> case b of
    False' -> False'
    True' -> True'
  True' -> case b of
     False' -> True'
     True' -> False'

main = do
  print (or' True' True')
  print (or' True' False')
  print (and' True' True')
  print (and' True' False')
  print (xor' True' False')
  print (xor' True' True')
```

- JavaScript

```javascript
True = True => False => True;
False = True => False => False;

show = bool => bool("True")("False");
print = bool => console.log(show(bool));

or = a => b => (a (True) (b));
and = a => b => (a (b) (False));
xor = a => b => (a (b (False) (True)) (b (True) (False)));

print (or (True) (True));
print (or (True) (False));
print (and (True) (True));
print (and (True) (False));
print (xor (True) (True));
print (xor (True) (False));
```

## Nats

For recursive data-types, Church-encoding represents structures as folds, Scott-encoding represents structures as pattern-matchs. Scott-encoding is directly equivalent to Haskell ADTs. Church-encoding is equivalent to a Haskell ADT with `fold` pre-applied to it. Scott-encoding is good because it allows O(1) pattern-matching, but it is bad because recursive algorithms need non-termination and it doesn't fuse. Church-encoding is good because it allows O(1) concatenation (monadic bind), but it is bad because pattern-matching is O(N).

- Haskell

```haskell
data Nat = Succ Nat | Zero deriving Show

foldNat (Succ pred) succ zero = succ (foldNat pred succ zero)
foldNat  Zero       succ zero = zero

add a b = foldNat a Succ b
mul a b = foldNat a (foldNat b Succ) Zero

isZero a = case a of
  (Succ a) -> False
  Zero     -> True

c0 = Zero
c1 = Succ c0
c2 = Succ c1
c3 = Succ c2

main = do
  print (add c3 c2)
  print (mul c3 c2)
  print (isZero c0)
  print (isZero c1)
```

- JavaScript (Church-encoding)

```javascript
Succ = nat => Succ => Zero => Succ (nat (Succ) (Zero));
Zero =        Succ => Zero => Zero;

show = nat => nat (nat => "(Succ " + nat + ")") ("Zero");
print = nat => console.log(show(nat));

add = a => b => a (Succ) (b);
mul = a => b => a (b (Succ)) (Zero);

isZero = a => a (a => "False") ("True");

c0 = Zero;
c1 = Succ (c0);
c2 = Succ (c1);
c3 = Succ (c2);

print (add (c3) (c2));
print (mul (c3) (c2));
console.log (isZero (c0));
console.log (isZero (c1));
```

- JavaScript (Scott-encoding)

```javascript
Succ = nat => Succ => Zero => Succ (nat);
Zero =        Succ => Zero => Zero

show = nat => nat (nat => "(Succ " + show(nat) + ")") ("Zero");
print = nat => console.log(show(nat));

foldNat = a => succ => zero => a (pred => succ (foldNat (pred) (succ) (zero))) (zero);

add = a => b => foldNat (a) (Succ) (b);
mul = a => b => foldNat (a) (foldNat (b) (Succ)) (Zero);

isZero = a => a (a => "False") ("True");

c0 = Zero;
c1 = Succ (c0);
c2 = Succ (c1);
c3 = Succ (c2);

print (add (c3) (c2));
print (mul (c3) (c2));
console.log (isZero (c0));
console.log (isZero (c1));
```

## Lists

Check out [Moon-Base](https://github.com/MaiaVictor/moon-lang/tree/master/base), it is a growing library written in a subset of JS which has only functions, numbers, maps and strings. As such, most algorithms are λ-encoded. It currently has a bunch of Church-encoded list algorithms, and also merge-sort on Scott-encoded lists. Feel free to contribute.

If you have any question about λ-encodings, feel free to open an issue on this repository.
