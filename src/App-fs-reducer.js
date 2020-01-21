import React, { Fragment, useRef, useReducer } from "react";
import "./App.css";

// STATES
const NOT_SUBMITTED = "NOT_SUBMITTED";
const SUBMITTING = "SUBMITTING";
const SUCCESS = "SUCCESS";
const ERROR = "ERROR";

// EVENTS
const RESET = "RESET";
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
        case NOT_SUBMITTED:
        case SUCCESS:
        case ERROR:
          event.inputRef.current.value = "";
          return {
            value: NOT_SUBMITTED,
            context: {
              email: "",
              error: null,
              data: null
            }
          };
        default:
          return state;
      }
    case SUBMIT:
      switch (state.value) {
        case NOT_SUBMITTED:
        case SUCCESS:
          return {
            ...state,
            value: SUBMITTING,
            context: {
              ...state.context,
              data: null,
              error: event.message
            }
          };
        default:
          return state;
      }
    case LOG_ERROR:
      switch (state.value) {
        case SUBMITTING:
          return {
            ...state,
            value: ERROR,
            context: {
              ...state.context,
              error: event.message,
              data: null
            }
          };
        default:
          return state;
      }
    case LOG_SUCCESS:
      switch (state.value) {
        case SUBMITTING:
          event.inputRef.current.value = "";
          return {
            ...state,
            value: SUCCESS,
            context: {
              ...state.context,
              data: event.message,
              error: null
            }
          };
        default:
          return state;
      }
    default:
      return state;
  }
}

function App() {
  let [current, send] = useReducer(reducer, {
    value: NOT_SUBMITTED,
    context: {
      error: null,
      data: null,
      email: ""
    }
  });
  let inputRef = useRef(null);

  function handleSubmit(event) {
    event.preventDefault();
    send({ type: SUBMIT });
    fetch(url)
      .then(res => {
        if (res.status !== 200) {
          throw new Error(res.statusText);
        }
        throwRandomErrorMaybe();
        return res.json();
      })
      .then(data => {
        send({ type: LOG_SUCCESS, inputRef, message: data.title });
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
          <Form ref={inputRef} onSubmit={handleSubmit} state={current.value} />
        </Card>
        <button
          className="button reset-button"
          onClick={() => {
            send({ type: RESET, inputRef });
          }}
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

// IDLE
// LOADING
// ERROR
// SUCCESS
