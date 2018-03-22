## Quick review of Lamping's abstract algorithm

There is an amazing algorithm capable of evaluating functional programs optimally, known as [Lamping's abstract algorithm](https://github.com/maiavictor/abstract-algorithm). It is extremely promising for being simple, efficient and inherently parallel. The main issue hindering its adoption is the unfortunate fact it doesn't work for all λ-terms. For some of them, it simply returns incorrect results. In order to solve this issue, Lamping, and many others, attempted to extend the original algorithm with a machinery known as "oracle". The problem is that, so far, every attempt at designing an oracle ruined the original performance of the algorithm. Mind this table:

Term | GeomOpt | GeomImpl | IntComb | YALE | none
 -- | --- | --- | --- | --- | ---
 22II | 204 | 56 | 66 | 38 | 21
222II | 789 | 304 | 278 | 127 | 50
3II | 75 | 17 | 32 | 17 | 9
 33II | 649 | 332 | 322 | 87 | 49
322II | 7055 | 4457 | 3268 | 383 | 85
223II | 1750 | 1046 | 869 | 213 | 69
 44II | 3456 | 2816 | 2447 | 148 | 89

It shows the total number of [graph rewrites](https://github.com/MaiaVictor/abstract-algorithm/blob/master/images/combinators_rules.png?raw=true) required to evaluate a few λ-terms with existing oracles, with the last column showing the oracle-free version. As you can see, the difference is brutal, rendering the algorithm unpractical. Note that, while YALE, in some cases, has almost comparable performance in number of rewrites, it has very complex rules and, as such, would require way more instructions in practice.

## The oracle-free subset is turing-complete!

There is, though, a huge subset of λ-terms that is computable without the oracle. What if this subset is sufficient? In other words, what if, instead of trying to adapt the algorithm to work with all λ-terms, we designed a type system that restricted outselves to that subset? Such proposal would raise 2 main questions:

1. Is this subset expressive enough to solve any problem?

2. Would such language allow for natural programming styles?

We now can answer both questions. [This program](hhttps://github.com/MaiaVictor/abstract-algorithm/blob/master/examples/lambda-calculus.js) implements an evaluator of arbitrary λ-terms *as a λ-term that can be evaluated on Lamping's abstract algorithm without the oracle*! It, thus, demonstrates that oracle-free terms are turing-complete. Note that this code is obfuscated and would look much cleaner in a suitable syntax.

As such, yes, we could have a language based on this subset. That language would impose some restrictions at compile time, enabling your programs to be computed optimally and in parallel. If someone found those restrictions too bothersome, no problems: he/she can always fallback to a monadic DSL and use whatever programming style he/she prefers.
