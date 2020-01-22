# State machine from scratch

This project was developed for a talk at [Reactadelphia](https://www.meetup.com/Reactadelphia/) on January 21, 2020. This is not intended to be a fully featured state machine implementation, and I do not recommend any of the code for production use.

If you like the APIs here and want to try similar tactics for your project, I recommend trying [`@xstate/fsm`](https://xstate.js.org/docs/packages/xstate-fsm/). This code was largely inspired by the implementation of that package (and the API of the machine config is interchangable!).

If you want to dig in more deeply to state machines, I highly recommend reading the [XState docs](https://xstate.js.org/docs/) as they are a treasure trove of knowledge with tons of links to additional resources throughout.

### What you'll find here

I have created three versions of the same email subscription widget:
  1) One using standard `useState` calls to manage the form's various states as independent logic (`src/App.js`)
  2) One using our custom state machine (`src/App-with-machine.js`)
  3) One using a plain reducer implemented using some of concepts we learned during the talk (`src/App-fs-reducer.js`)

To run any of the demos, update the import statement in `src/index.js` to use the appropriate `App` file.

The custom state machine is located in `src/state-machine.js`. The rest of the code is for demo purposes only and should not be taken too seriously. Enjoy!
