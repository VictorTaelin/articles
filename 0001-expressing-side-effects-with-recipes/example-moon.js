const Moon = require("moon-lang");

// A Recipe for a program that tells the user his BMI
const getUserBMIRecipe = Moon.parse(`prompt. alert. return.
  height: <(prompt "What is your height (in meters)?")
  weight: <(prompt "What is your weight (in kg)?")
  bmi: (div (stn weight) (mul (stn height) (stn height)))
  (alert (con "Your BMI is " (nts bmi)))>
  (return bmi)
`);

// Converts a Recipe into a mocked program
const mock = recipe => recipe
  (text => cont => ([input,...rest]) => [["prompted", text]].concat(cont(input)(rest)))
  (text => cont => ([input,...rest]) => [["alerted", text]].concat(cont(input)(rest)))
  (result => ([input,...rest]) => [["returned", result]]);

// Mocks the program above
const mockedGetUserBMI = mock(getUserBMIRecipe);

// Tests it with fake user inputs
console.log(mockedGetUserBMI(["1.80", "70"]));
