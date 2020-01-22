import { useState, useEffect, useRef } from "react";

/*
It's helpful to start any project using a state machine by defining our possible
states
*/
const NOT_STARTED = "NOT_STARTED";
const RUNNING = "RUNNING";
const STOPPED = "STOPPED";

/*
A machine definition is an object with defined state values and transition
instructions. In our implementation it will look something like this.

let machineDefinition = {
  initial: "IDLE",
  context: {
    some: 'data',
  },
  states: {
    "IDLE": {
      on: {
        "DO_A_THING": {
          target: "BUSY",
          actions: [
            { type: "sideEffect", exec: (context, event) => ({ ...event.someData }) }
          ]
        }
      }
    },
    "BUSY": {
      on: {
        "STOP_DOING": {
          target: "IDLE",
        }
      }
    }
  }
}

An action will be an object that takes the shape of:
{ type: string; exec(context, event): void }
*/

export function createMachine(machineDefinition) {
  /*
  A machine will have an initialState key and a transition function. That's it!
  The rest of our magic happens with our interpreter and our React hook.
  */
  let machine = {
    initialState: {
      value: machineDefinition.initial,
      actions: machineDefinition.states[machineDefinition.initial].entry || [],
      context: machineDefinition.context || {}
    },
    transition(currentState, event) {
      /*
      First thing's first, we need to define our state object with the current
      state's value, its associated contextual data, and any actions we need to
      perform. We'll always return a state object with our transition, so we'll
      call this our `unchangedState` we can use if no transitions match our
      definition.
       */
      let context = currentState.context || machineDefinition.context;
      let unchangedState = {
        value: currentState.value,
        context,
        actions: []
      };

      /*
      Get the full definition of our current state and the requested transition
      from our machine definition. If the transition isn't defined, we can bail
      out and return the unchanged state object.
      */
      let stateDefinition = machineDefinition.states[currentState.value];
      let transitionDefinition = stateDefinition.on[event.type];

      if (!transitionDefinition) {
        return unchangedState;
      }

      /*
      Now that we have the transition defined, we need to figure out:
        1) what is our target state?
        2) what conditions need to be met for the transition to be successful?
      */
      let target = transitionDefinition.target || currentState.value;

      /*
      The conditional function should return true if the transition is allowed,
      and false if not.
      */
      function cond(context, event) {
        if (typeof transitionDefinition.cond === "function") {
          return transitionDefinition.cond(context, event);
        } else {
          return true;
        }
      }

      let nextContext = context;

      /*
      Check if the condition is met.
      If no transition match, just return the state unchanged
      */
      if (!cond(context, event)) {
        return unchangedState;
      }

      /*
      Next we need to figure out all the actions we need to take.
        1) Our current state exits, so fire off its exit actions
        2) Our transition occurs, so fire off all transition actions.
        3) Our next state enters, so fire off its entry actions.
      */
      let nextStateDefinition = machineDefinition.states[target];
      let currentStateExitActions = stateDefinition.exit || [];
      let transitionActions = transitionDefinition.actions || [];
      let nextStateEntryActions = nextStateDefinition.entry || [];

      /*
      Package up all of our actions in the correct order.
      */
      let allActions = [
        ...currentStateExitActions,
        ...transitionActions,
        ...nextStateEntryActions
      ];

      /*
      We treat assignment actions differently than any other actions because we
      need the updated context data in our updated state object. All other
      actions are stored in the actions key of the state object and fired off in
      order when the service starts and an event is delivered.

      Instead of remembering and using this key in our app, we'll export an
      `assign` function that handles this for us.
      */
      let actions = allActions.filter(action => {
        if (action.type === "ASSIGN_CONTEXT") {
          let tempContext = { ...nextContext };
          tempContext = action.assignment(nextContext, event);
          nextContext = tempContext;
          return false;
        }
        return true;
      });

      return {
        value: target,
        context: nextContext,
        actions
      };
    }
  };
  return machine;
}

/*
We could use our machine directly like this:

let myMachine = createMachine({...});
let state = machine.initialState;
console.log(state.value) // whatever our initial state is, maybe "IDLE"
state = machine.transition({ value: 'IDLE' }, 'DO_A_THING')
console.log(state.value) // whatever our next state is, maybe "BUSY"

This isn't really sufficient for a real app, so we'll build an interpreter
function.

From the XState docs:

While a state machine/statechart with a pure .transition() function is useful
for flexibility, purity, and testability, in order for it to have any use in a
real-life application, something needs to:
    - Keep track of the current state, and persist it
    - Execute side-effects
    - Handle delayed transitions and events
    - Communicate with external services

The interpreter is responsible for interpreting the state machine/statechart
and doing all of the above. We need to parse and execute our machine it in a
runtime environment. An interpreted, running instance of a statechart is called
a service.

This function takes a machine as its argument and returns a service that we can
start and stop so that we can use it to send events and kick of transitions.
 */
function interpret(machine) {
  /*
  Set our initial state for the service. Our state machine uses the same concept
  of finite states under the hood. How cool!
  */
  let status = NOT_STARTED;

  /*
  Get our current state and set up an object where we can store listeners.
  When an event is fired, whatever callback we create as a listener when we
  subscribe to the service will be updated any time our state changes.
  This will be how our `useMachine` hook communicates with our state machine and
  updates local state in React as events are sent!
  */
  let state = machine.initialState;
  let listeners = new Set();

  /*
  Define our state machine service object with the following functions:
    - send
    - subscribe
    - start
    - stop
  */
  let service = {
    /*
    The send function is where we pass messages to our machine so that it can
    fire transitions and actions.
     */
    send(event) {
      // Only send events if our machine is running
      if (status !== RUNNING) {
        return;
      }

      /*
      Update our state by calling a transition to find the new state based on
      the event we send.
       */
      state = machine.transition(state, event);

      /*
      Now that we have our new state, we can start executing all of the actions
      we stored in the state object in our `createMachine` function in the
      correct order.
      */
      for (let action of state.actions || []) {
        action.exec(state.context, event);
      }

      /*
      After firing our actions, we call the listener functions set up any time a
      subscription is called.
      */
      for (let listener of listeners) {
        listener(state);
      }
    },

    /*
    An app can subscribe to state changes and do something with the updated
    state via a listener function. This is key for interpretting our transition
    for use in React (or any other framework/application).
    */
    subscribe(listener) {
      /*
      Add the listener to our store and immediately call it with the current
      state.
      */
      listeners.add(listener);
      listener(state);

      // Return a clean up function so our app can unsubscribe
      return {
        unsubscribe() {
          listeners.delete(listener);
        }
      };
    },

    /*
    This function starts our machine so that everything works as expected.
    */
    start() {
      // Update our status state to indicate that our machine is running
      status = RUNNING;
      for (let action of state.actions || []) {
        /*
        Fire actions with an initializer event to kick off any immediate
        transitions update context, or perform any side effects defined by our
        machine.
        */
        action.exec(state.context, {
          type: "STATE_MACHINE_INIT"
        });
      }
      // Return our service for use by our app.
      return service;
    },
    /*
    This function stops our machine completely, cleans up our listeners and
    prevents new events from changing the state.
    */
    stop() {
      // Update the state of our machine to STOPPED
      status = STOPPED;
      // Remove all of our listeners from the store.
      for (let listener of listeners) {
        listeners.delete(listener);
      }
      // Return our service for, we can always restart it again later!
      return service;
    }
  };
  return service;
}

export function useMachine(initialMachine) {
  /*
  Our state machine and the service from our interpreter should not change
  between renders. We create a `useConstant` function to guarantee that the
  values will never be recalculated. (useMemo does not offer that guarantee!)
  https://github.com/Andarist/use-constant
  https://reactjs.org/docs/hooks-faq.html#how-to-create-expensive-objects-lazily
  */
  const machine = useConstant(() => initialMachine);
  const service = useConstant(() => interpret(machine).start());

  // Store our machine state in React state
  const [current, setCurrent] = useState(machine.initialState);

  useEffect(() => {
    /*
    When the component is up and running, subscribe to our state machine and use
    `setCurrent` as our listener to keep our component's state aligned with the
    state machine. Return a cleanup function to stop the service when the
    component unmounts.
    */
    service.subscribe(setCurrent);
    return () => {
      service.stop();
    };
  }, [service]);

  /*
  Our hook provides components with the current state object, and our service's
  send function to send events to the machine.
  */
  return [current, service.send];
}

/*
 Our `assign` function is an action creator to tell our state machine that we're
 performing an action to update contextual data.
 */
export function assign(assignment) {
  return {
    type: "ASSIGN_CONTEXT",
    assignment(context, event) {
      let newContext = assignment(context, event);
      return newContext;
    }
  };
}

function useConstant(fn) {
  const ref = useRef();
  if (!ref.current) {
    ref.current = { v: fn() };
  }
  return ref.current.v;
}
