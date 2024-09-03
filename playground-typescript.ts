interface Test {
  a: string;
}

interface Test1 extends Test {
  b?: string;
}

const aF = (val: Test1) => {
  console.log(val);
};

aF({ a: '1' });
