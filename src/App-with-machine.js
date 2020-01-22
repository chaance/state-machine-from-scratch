import React, { useEffect, useRef } from "react";
import { createMachine, assign, useMachine } from "./state-machine";
import "./App.css";

// STATES
const EMPTY = "EMPTY";
const WORKING = "WORKING";
const SUBMITTING = "SUBMITTING";
const SUCCESS = "SUCCESS";
const ERROR = "ERROR";

// EVENTS
const RESET = "RESET";
const CANCEL_SUBMIT = "CANCEL_SUBMIT";
const CHANGE_VALUE = "CHANGE_VALUE";
const SUBMIT = "SUBMIT";
const LOG_ERROR = "LOG_ERROR";
const LOG_SUCCESS = "LOG_SUCCESS";

let user = "chancestrickland";
let repo = "state-machine-from-scratch";
let url = `https://my-json-server.typicode.com/${user}/${repo}/posts/1`;

// Actions
const changeEmailValue = assign((context, event) => {
  return {
    error: null,
    email: event.value
  };
});

const clearData = assign((context, event) => {
  return {
    ...context,
    data: null
  };
});

const resetContext = assign(() => ({ email: "", data: null, error: null }));

const setError = assign((context, event) => {
  return {
    data: null,
    error: event.error
  };
});

const clearEmail = assign(context => ({ ...context, email: "" }));

const setDataAfterSubmit = assign((context, event) => {
  return {
    error: null,
    data: event.data
  };
});

const logError = {
  type: "logError",
  exec(context) {
    console.error(context.error);
  }
};

let newsletterMachine = createMachine({
  initial: EMPTY,
  context: {
    email: "",
    data: null,
    error: null
  },
  states: {
    [EMPTY]: {
      on: {
        [CHANGE_VALUE]: {
          target: WORKING,
          actions: [changeEmailValue]
        }
      }
    },
    [WORKING]: {
      on: {
        [CHANGE_VALUE]: {
          target: WORKING,
          actions: [changeEmailValue]
        },
        [SUBMIT]: {
          target: SUBMITTING,
          actions: [changeEmailValue, clearData]
        },
        [RESET]: {
          target: EMPTY,
          actions: [resetContext]
        }
      }
    },
    [SUBMITTING]: {
      on: {
        [CANCEL_SUBMIT]: {
          target: WORKING
        },
        [LOG_ERROR]: {
          target: ERROR,
          actions: [setError, logError]
        },
        [LOG_SUCCESS]: {
          target: SUCCESS,
          actions: [setDataAfterSubmit, clearEmail]
        }
      }
    },
    [ERROR]: {
      on: {
        [CHANGE_VALUE]: {
          target: WORKING,
          actions: [changeEmailValue]
        },
        [SUBMIT]: {
          target: SUBMITTING,
          actions: [changeEmailValue, clearData]
        },
        [RESET]: {
          target: EMPTY,
          actions: [resetContext]
        }
      }
    },
    [SUCCESS]: {
      on: {
        [CHANGE_VALUE]: {
          target: WORKING,
          actions: [changeEmailValue]
        },
        [RESET]: {
          target: EMPTY,
          actions: [resetContext]
        },
        [SUBMIT]: {
          target: SUBMITTING,
          actions: [changeEmailValue, clearData]
        }
      }
    }
  }
});

function App() {
  let [current, send] = useMachine(newsletterMachine);
  let inputRef = useRef(null);
  let shouldAbort = useRef(false);

  function handleSubmit(event) {
    event.preventDefault();
    send({ type: SUBMIT, value: current.context.email });
  }

  useEffect(() => {
    if (current.value === SUBMITTING) {
      /*
      Only abort the fetch and send a cancel event
      if we interrupt the process before receiving data
      */
      shouldAbort.current = true;
      let abortController = new AbortController();
      fetch(url, { signal: abortController.signal })
        .then(res => {
          if (res.status !== 200) {
            throw new Error(res.statusText);
          }
          throwRandomErrorMaybe();
          return res.json();
        })
        .then(data => {
          // this is a fake API call so we'll just append the email here
          // just to keep this moving.
          data.email = current.context.email;
          shouldAbort.current = false;
          send({ type: LOG_SUCCESS, data });
        })
        .catch(error => {
          if (!abortController.signal.aborted) {
            shouldAbort.current = false;
            send({ type: LOG_ERROR, error });
          }
        });

      return () => {
        if (shouldAbort.current) {
          abortController.abort();
          send({ type: CANCEL_SUBMIT });
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.value]);

  useEffect(() => {
    if (current.context.data) {
      console.log(current.context.data);
    }
  }, [current.context.data]);

  useEffect(() => {
    if (current.context.error) {
      console.error(current.context.error);
    }
  }, [current.context.error]);

  return (
    <div className="App">
      <header className="App-header">
        <div className="card">
          <div className="message">
            <h3>
              {current.value === ERROR
                ? "Uh oh, something went wrong!"
                : current.value === SUCCESS
                ? "Thank you for signing up!"
                : "Sign up for our newsletter"}
            </h3>
            <p>
              {current.value === SUBMITTING
                ? "Loading..."
                : current.value === ERROR
                ? current.context.error?.message
                : current.value === SUCCESS
                ? current.context.data?.title
                : "Check out all of the latest and greatest!"}
            </p>
          </div>
          <Form
            ref={inputRef}
            value={current.context.email}
            onChange={event => {
              send({ type: CHANGE_VALUE, value: event.target.value });
            }}
            onSubmit={handleSubmit}
            state={current.value}
          />
        </div>
        <button
          disabled={current.value === SUBMITTING}
          className="button reset-button"
          onClick={() => send({ type: RESET, inputRef })}
        >
          Reset
        </button>
      </header>
    </div>
  );
}

const Form = React.forwardRef(
  ({ onChange, onSubmit, state, value }, inputRef) => {
    console.log({ state });
    return (
      <form className="Form" onSubmit={onSubmit}>
        <label className="Form-label">
          <span>Your Email</span>
          <input
            ref={inputRef}
            type="text"
            name="email"
            disabled={state === SUBMITTING}
            value={value}
            onChange={onChange}
          />
        </label>
        <button
          disabled={state === SUBMITTING || state === EMPTY}
          className="button"
        >
          Sign Up!
        </button>
      </form>
    );
  }
);

export default App;

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function throwRandomErrorMaybe() {
  if (getRandomInt(3) === 1) {
    throw new Error("Please try your submission again later.");
  }
}
