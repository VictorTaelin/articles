True = True => False => True;
False = True => False => False;

show = bool => bool("True")("False");
print = bool => console.log(show(bool));

or = a => b => (a (b) (False));
and = a => b => (a (True) (b));
xor = a => b => (a (b (False) (True)) (b (True) (False)));

print (or (True) (True));
print (or (True) (False));
print (and (True) (True));
print (and (True) (False));
print (xor (True) (True));
print (xor (True) (False));




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
