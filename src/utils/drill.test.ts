import { it } from "node:test";
import { drill } from "./drill";
import assert from "node:assert";

type MyNode = {
  id: string;
  color: string;
  numbers: number[];
  children?: MyNode[];
};

type MyState = {
  nodes: Record<string, MyNode>;
};

it("behaves correctly", () => {
  const initialState: MyState = {
    nodes: {
      a: {
        id: "a",
        color: "red",
        numbers: [1, 2, 3],
        children: [
          {
            id: "a-1",
            color: "purple",
            numbers: [5, 9, 3],
          },
        ],
      },
      b: {
        id: 'b',
        color: 'green',
        numbers: [10, 0, 7],
        children: [
          {
            id: 'b-1',
            color: 'pink',
            numbers: [8],
            children: [
              {
                id: 'b-1-1',
                color: 'orange',
                numbers: [12, 14, 16]
              }
            ]
          }
        ]
      }
    },
  };


  const d = drill<MyState>(initialState);



  const aChildren = d.select('nodes.a.children');


  assert(aChildren.get() !== undefined);
  assert(Array.isArray(aChildren.get()));


  aChildren.subscribe((children) => {
    console.log(`children of "a" changed`, children);
  });


  aChildren.set((children) => [...(children || []), { id: 'a-2', color: 'green', numbers: [7, 1] }]);

  console.dir(initialState, { depth: null });
});
