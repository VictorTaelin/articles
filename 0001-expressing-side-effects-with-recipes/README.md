## Expressing side-effects with Recipes (and how that can be useful)

One of the benefits of using a language free of side-effects such as Haskell is how easy it is to write tests. Since everything is just pure functions all the way down, you can test any program [by merely checking if it returns what you expect](https://stackoverflow.com/a/986737/1031791). This article will explain how arbitrary side-effective algorithms can be expressed purely, and how that can be useful in situations such as [when writing mocks and tests](no-need-to-mock.png). This technique applies to arbitrary languages, not only pure ones.

Mind the following JavaScript program:

```javascript
function getUserBMI() {
  return new Promise((resolve, reject) => {
    var height = prompt("What is your height (in meters)?");
    var weight = prompt("What is your weight (in kg)?");
    var bmi = Number(weight) / (Number(height) * Number(height));
    alert("Your BMI is " + bmi + ".");
    return bmi;
  });
}
```

When executed, it asks the user his height/weight, tells him his body mass index and returns a Promise that resolves to it. Pretty basic. Problem is: how do we test it? Since it contains side-effective operations (`prompt` / `alert`), we need to build a mock. Mocking isn't widely regarded as the most satisfying occupation, but it could be avoided if `getUserBMI` was pure function. That might sound nonsense at first: `getUserBMI` requires user input, so it can't be pure! This is correct, but it can still be *expressed* purely with a simple trick, which I'll call "Recipes". Lets define a "Recipe" to be either:

1. An array of 3 elements: a string, a list of JSON, and a function that receives a JSON and returns a Recipe.

2. An array of 2 elements: the string "return" and a value.

The cool thing about this format is that it is sufficient to describe any impure algorithm purely! The trick is that, instead of actually printing things or querying databases, a Recipe merely specifies queries, leaving the actual effects to be defined later. This is, for example, the Recipe of the program above:

```javascript
const getUserBMIRecipe =
  ["prompt", ["What is your height (in meters)?"], (height) =>
    ["prompt", ["What is your weight (in kg)?"], (weight) => {
        var bmi = Number(weight) / (Number(height) * Number(height));
        return ["alert", ["Your BMI is " + bmi], () =>
          ["return", bmi]
        ];
    }]
  ];
```

Note how this is just a pure expression that doesn't do anything by itself. We can, though, convert it into an actual program, by using a suitable definition of `run()`:

```javascript
const run = ([request,params,cont]) => () => {
  switch (request) {
    case "prompt": return Promise.resolve(run(cont(prompt(params[0])))());
    case "alert": return Promise.resolve(run(cont(alert(params[0])))());
    case "return": return Promise.resolve(parmas);
  }
};
```

This would be defined in a library, so you don't need to define it yourself. Lets apply `run()` to `getUserBMIRecipe`:

```javascript
const getUserBMI = run(getUserBMIRecipe);
```

The resulting `getUserBMI()` function works exactly like the one we defined previously! You can check it yourself [here](http://jsbin.com/pajujekexa/edit?html,output). Now we can use the same Recipe to generate a mocked version of `getUserBMI`:

```javascript
const mock = ([request,params,cont]) => ([input,...rest]) => {
  switch (request) {
    case "return": return [["returned", params]];
    case "prompt": return [["prompted", params[0]]].concat(mock(cont(input))(rest));
    case "alert": return [["alerted", params[0]]].concat(mock(cont())(rest));
  }
};
```

`mock()` emulates the behavior of a program based on a list of fake inputs. Let's try it with `1.80` and `70`:

```javascript
const mockedGetUserBMI = mock(getUserBMIRecipe);

console.log(mockedGetUserBMI(["1.80", "70"]));
```

The program above outputs:

```javascript
[ [ 'prompted', 'What is your height (in meters)?' ],
  [ 'prompted', 'What is your weight (in kg)?' ],
  [ 'alerted', 'Your BMI is 21.604938271604937' ],
  [ 'returned', 21.604938271604937 ] ]
```

As you can see, this is immensely useful for tests, since it emulates and inspects the execution of a program at any point. A more complete definition of `run()`/`mock()` would allow us to automatically mock any effective program, including those with database accesses, HTTP requests, mouse events and so on.

There is an obvious problem, though: Recipes are so verbose they even have their own callback hell! That's where [Moon-lang](https://github.com/maiavictor/moon-lang) can be handy. It is an ultra-lightweight language designed to express pure algorithms. Lets define Recipe with Moon:

```javascript
const getUserBMIRecipe = Moon.parse(`prompt. alert. return.
  height: <(prompt "What is your height (in meters)?")
  weight: <(prompt "What is your weight (in kg)?")
  bmi: (div (stn weight) (mul (stn height) (stn height)))
  (alert (con "Your BMI is " (nts bmi)))>
  (return bmi)
`);
```

It avoids the callback hell thanks the `<(...)` and `(...)>` operators, which unlift the result of a side-effective operation. They're, in essence, a generalization of `async/await` for arbitrary effects, allowing Recipe to be expressed succinctly. Note that, since Moon's parser/compiler is fast and generates efficient machine code, you can actually use it instead of JavaScript to define functions. As a bonus, functions defined that way can be easily shared across different programming languages and environments. Of course, that's optional and the technique still applies for JS alone.

And that is it. In short, recipes are handy tools that allow you to express side-effective algorithms purely by delaying the decision of how to execute those effects, and they can be useful for writting tests and to restrict the effects of certain programs. Here are working examples of this technique: [JavaScript only](example-javascript.js) / [using Moon](example-moon.js).

---

If you're curious, what I'm calling Recipe is actually this algebraic datatype:

```haskell
data Recipe a
  = Ask String [JSON] (JSON -> Recipe a)
  | End a
```

Which is sufficient because it is the monad for JSON-based remote procedure calls between a pure environment and an external oracle. 

The trick to avoid the callback hell used by Moon is a combination of church-encoded [free monads](https://gist.github.com/MaiaVictor/cd979cd66b2494a91eac83c64661a462) with an adaptation of Idris's [bang-notation](https://www.reddit.com/r/haskell/comments/6n9wlc/the_bangnotation_is_surprisingly_powerful/).



