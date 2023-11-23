console.log("avatar test 4!!!!");

let message: string = "Hello, TypeScript!";
let count: number = 42;
console.log(message, count);

function addNumbers(a: number, b: number): number {
  return a + b;
}
console.log(addNumbers(10, 5));

interface User {
  name: string;
  age: number;
}

let user: User = { name: "Alice", age: 30 };
console.log(user);
