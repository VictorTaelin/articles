// Converts a Recipe into an actual, side-effective program
const run = ([request,params,cont]) => () => {
  switch (request) {
    case "return": return Promise.resolve(parmas);
    case "prompt": return Promise.resolve(run(cont(prompt(params[0])))());
    case "alert": return Promise.resolve(run(cont(alert(params[0])))());
  }
};

// Converts a Recipe into a mocked program
const mock = ([request,params,cont]) => ([input,...rest]) => {
  switch (request) {
    case "return": return [["returned", params]];
    case "prompt": return [["prompted", params[0]]].concat(mock(cont(input))(rest));
    case "alert": return [["alerted", params[0]]].concat(mock(cont())(rest));
  }
};

// A Recipe for a program that tells the user his BMI
const getUserBMIRecipe =
  ["prompt", ["What is your height (in meters)?"], (height) =>
    ["prompt", ["What is your weight (in kg)?"], (weight) => {
        var bmi = Number(weight) / (Number(height) * Number(height));
        return ["alert", ["Your BMI is " + bmi], () =>
          ["return", bmi]
        ];
    }]
  ];

// Generates a side-effective program (works on the browser)
const getUserBMI = run(getUserBMIRecipe);
// getUserBMI(); // works on the browser

// Generates a mocked program
const mockedGetUserBMI = mock(getUserBMIRecipe);

// Tests it with fake inputs
console.log(mockedGetUserBMI(["1.80", "70"]));


