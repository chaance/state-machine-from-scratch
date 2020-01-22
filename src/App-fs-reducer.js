import React, { useEffect, useRef, useReducer } from "react";
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

function reducer(state, event) {
  switch (event.type) {
    case RESET:
      switch (state.value) {
        case EMPTY:
        case WORKING:
        case SUCCESS:
        case ERROR:
          return {
            value: EMPTY,
            context: {
              email: "",
              error: null,
              data: null
            }
          };
        default:
          return state;
      }
    case CHANGE_VALUE:
      switch (state.value) {
        case ERROR:
        case SUCCESS:
        case WORKING:
        case EMPTY:
          return {
            ...state,
            value: WORKING,
            context: {
              ...state.context,
              email: event.value,
              error: null
            }
          };
        default:
          return state;
      }
    case SUBMIT:
      switch (state.value) {
        case WORKING:
        case SUCCESS:
        case ERROR:
          return {
            ...state,
            value: SUBMITTING,
            context: {
              ...state.context,
              data: null
            }
          };
        default:
          return state;
      }
    case LOG_ERROR:
      switch (state.value) {
        case SUBMITTING:
          return !event.aborted
            ? {
                ...state,
                value: ERROR,
                context: {
                  ...state.context,
                  error: event.error,
                  data: null
                }
              }
            : state;
        default:
          return state;
      }
    case LOG_SUCCESS:
      switch (state.value) {
        case SUBMITTING:
          return {
            ...state,
            value: SUCCESS,
            context: {
              ...state.context,
              email: "",
              data: event.data,
              error: null
            }
          };
        default:
          return state;
      }
    case CANCEL_SUBMIT:
      switch (state.value) {
        case SUBMITTING:
          if (event.shouldAbort) {
            event.abortController.abort();
            return {
              ...state,
              value: WORKING
            };
          }
          return state;
        default:
          return state;
      }
    default:
      return state;
  }
}

function App() {
  let [current, send] = useReducer(reducer, {
    value: EMPTY,
    context: {
      error: null,
      data: null,
      email: ""
    }
  });
  let inputRef = useRef(null);
  let shouldAbort = useRef(false);

  function handleSubmit(event) {
    event.preventDefault();
    send({ type: SUBMIT });
  }

  useEffect(() => {
    if (current.value === SUBMITTING) {
      // Set up for cancellation
      shouldAbort.current = true;
      let abortController = new AbortController();

      fetch(url, { signal: abortController.signal })
        .then(res => {
          // Throw random errors for demo purposes
          throwRandomErrorMaybe();
          return res.json();
        })
        .then(data => {
          shouldAbort.current = false;
          send({
            type: LOG_SUCCESS,
            data: {
              ...data,
              // this is a fake API call so we'll just append the email here
              // just to keep this moving.
              email: current.context.email
            }
          });
        })
        .catch(error => {
          shouldAbort.current = false;
          send({
            type: LOG_ERROR,
            error,
            aborted: abortController.signal.aborted
          });
        });

      return () => {
        send({
          type: CANCEL_SUBMIT,
          abortController,
          shouldAbort: shouldAbort.current
        });
      };
    }
  }, [current.context.email, current.value]);

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
          className="button reset-button"
          onClick={() => {
            send({ type: RESET });
          }}
        >
          Reset
        </button>
      </header>
    </div>
  );
}

const Form = React.forwardRef(
  ({ onChange, onSubmit, state, value }, inputRef) => {
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

// IDLE
// LOADING
// ERROR
// SUCCESS
