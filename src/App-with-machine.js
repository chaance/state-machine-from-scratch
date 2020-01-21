import React, { Fragment, useRef } from "react";
import { createMachine, assign, useMachine } from "./state-machine";
import "./App.css";

// STATES
const NOT_SUBMITTED = "NOT_SUBMITTED";
const SUBMITTING = "SUBMITTING";
const SUCCESS = "SUCCESS";
const ERROR = "ERROR";
const RESET = "RESET";

// EVENTS
const SUBMIT = "SUBMIT";
const LOG_ERROR = "LOG_ERROR";
const LOG_SUCCESS = "LOG_SUCCESS";

let user = "chancestrickland";
let repo = "state-machine-from-scratch";
let url = `https://my-json-server.typicode.com/${user}/${repo}/posts/1`;

let newsletterMachine = createMachine({
  initial: NOT_SUBMITTED,
  context: {
    email: "",
    data: null,
    error: null
  },
  states: {
    [NOT_SUBMITTED]: {
      on: {
        [SUBMIT]: {
          target: SUBMITTING,
          actions: [
            assign((context, event) => {
              return {
                ...context,
                email: event.email
              };
            })
          ]
        },
        [RESET]: {
          target: [NOT_SUBMITTED],
          actions: [
            assign(context => {
              return {
                ...context,
                email: "",
                data: null,
                error: null
              };
            })
          ]
        }
      }
    },
    [SUBMITTING]: {
      on: {
        [LOG_ERROR]: {
          target: ERROR,
          actions: [
            assign((context, event) => {
              return {
                ...context,
                data: null,
                error: event.message
              };
            }),
            {
              type: "logError",
              exec(context) {
                console.error(context.error);
              }
            }
          ]
        },
        [LOG_SUCCESS]: {
          target: SUCCESS,
          actions: [
            {
              type: "clearInput",
              exec(context, event) {
                if (event.inputRef && event.inputRef.current) {
                  event.inputRef.current.value = "";
                }
              }
            },
            assign((context, event) => {
              return {
                ...context,
                error: null,
                data: event.message
              };
            })
          ]
        }
      }
    },
    [ERROR]: {
      on: {
        [SUBMIT]: {
          target: SUBMITTING,
          actions: [
            assign((context, event) => {
              return {
                ...context,
                email: event.email
              };
            })
          ]
        },
        [RESET]: {
          target: [NOT_SUBMITTED],
          actions: [
            {
              type: "clearInput",
              exec(context, event) {
                if (event.inputRef && event.inputRef.current) {
                  event.inputRef.current.value = "";
                }
              }
            },
            assign(context => {
              return {
                email: "",
                data: null,
                error: null
              };
            })
          ]
        }
      }
    },
    [SUCCESS]: {
      on: {
        [RESET]: {
          target: [NOT_SUBMITTED],
          actions: [
            assign(context => {
              return {
                ...context,
                email: "",
                data: null,
                error: null
              };
            })
          ]
        },
        [SUBMIT]: {
          target: SUBMITTING,
          actions: [
            assign((context, event) => {
              return {
                ...context,
                email: event.email
              };
            })
          ]
        }
      }
    }
  }
});

/**
 * A simple button for fetching some data.
 *
 * When the user clicks the button, we want to:
 *   - start fetching data
 *   - change the display of the button to indicate fetching is
 *     happening
 *   - disable the button so clicks do not work while fetching
 *
 * When the fetch is complete, we want to:
 *   - check if the data came back successfully
 *   - if so:
 *       - display the data
 *       - update the button label to show our fetch was OK
 *       - remove it from the screen since we don't need it
 *         anymore!
 *
 *   - if not:
 *       - provide an error message
 *       - reset the button label and its disabled state so
 *         the user can try again.
 */

function App() {
  let [current, send] = useMachine(newsletterMachine);
  let inputRef = useRef(null);

  function handleSubmit(event) {
    event.preventDefault();
    send({ type: SUBMIT, email: "cool@cool.com" });
    fetch(url)
      .then(res => {
        if (res.status !== 200) {
          throw new Error(res.statusText);
        }
        throwRandomErrorMaybe();
        return res.json();
      })
      .then(data => {
        send({ type: LOG_SUCCESS, message: data.title, inputRef });
      })
      .catch(err => {
        send({ type: LOG_ERROR, message: err.message });
      });
  }

  return (
    <div className="App">
      <header className="App-header">
        <Card>
          <Message
            heading={
              current.value === SUCCESS
                ? "Thank you for signing up!"
                : current.value === ERROR
                ? "Uh oh, something went wrong!"
                : "Sign up for our newsletter"
            }
          >
            <MessageText
              state={current.value}
              successMessage={current.context.data}
              errorMessage={current.context.error}
            />
          </Message>
          <Form ref={inputRef} state={current.value} onSubmit={handleSubmit} />
        </Card>
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

const Form = React.forwardRef(({ onSubmit, state }, inputRef) => {
  return (
    <form className="Form" onSubmit={onSubmit}>
      <label className="Form-label">
        <span>Your Email</span>
        <input
          ref={inputRef}
          type="text"
          name="email"
          disabled={state === SUBMITTING}
        />
      </label>
      <button disabled={state === SUBMITTING} className="button">
        Sign Up!
      </button>
    </form>
  );
});

function Card(props) {
  return <div className="card" {...props} />;
}

function Message({ heading, children, ...props }) {
  return (
    <div className="message" {...props}>
      <h3>{heading}</h3>
      {children}
    </div>
  );
}

function MessageText({ state, successMessage, errorMessage }) {
  return (
    <Fragment>
      {state === SUBMITTING ? (
        <p>Loading...</p>
      ) : state === ERROR ? (
        <p>{errorMessage}</p>
      ) : state === SUCCESS ? (
        <p>{successMessage}</p>
      ) : (
        <p>Check out all of the latest and greatest!</p>
      )}
    </Fragment>
  );
}

export default App;

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function throwRandomErrorMaybe() {
  if (getRandomInt(3) === 1) {
    throw new Error("Please try your submission again later.");
  }
}
