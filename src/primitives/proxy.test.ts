import { it } from "node:test";
import { createProxyRef, proxySubscribe } from "./proxy";

type MyNode = {
  id: string;
  color: string;
  numbers: number[];
  children?: MyNode[];
};

it("Behaves correctly", () => {

  const node: MyNode = {
    id: 'root',
    color: 'red',
    numbers: [1, 2, 3, 4],
    children: [
      {
        id: 'child1',
        color: 'green',
        numbers: [42, 88, 0, 3],
      }
    ]
  }
  const ref = createProxyRef<MyNode>(node);



  proxySubscribe(ref.proxy, (next, prev) => {
    console.dir({ next, prev }, { depth: null });
  });

  ref.proxy.color = 'purple';
  ref.proxy.children!.push({
    id: 'child2',
    color: 'blue',
    numbers: [4, 3, 2, 7],
  });
  ref.proxy.children!.push({
    id: 'child3',
    color: 'pink',
    numbers: [5, 5, 5, 5],
  });
  ref.proxy.children![0].color = 'orange';
  ref.proxy.children!.pop();
  
});
