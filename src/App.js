import React, { Fragment, useRef, useState } from "react";
import "./App.css";

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
let user = "chancestrickland";
let repo = "state-machine-from-scratch";
let url = `https://my-json-server.typicode.com/${user}/${repo}/posts/1`;

function App() {
  let [data, setData] = useState(null);
  let [error, setError] = useState(null);
  let [loading, setLoading] = useState(false);
  let inputRef = useRef(null);

  function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    fetch(url)
      .then(res => {
        if (res.status !== 200) {
          throw new Error(res.statusText);
        }
        throwRandomErrorMaybe();
        return res.json();
      })
      .then(data => {
        setLoading(false);
        setData(data.title);
        inputRef.current.value = "";
      })
      .catch(err => {
        setLoading(false);
        setError(err.message);
      });
  }

  return (
    <div className="App">
      <header className="App-header">
        <Card>
          <Message
            heading={
              data
                ? "Thank you for signing up!"
                : error
                ? "Uh oh, something went wrong!"
                : "Sign up for our newsletter"
            }
          >
            <MessageText data={data} error={error} loading={loading} />
          </Message>
          <Form ref={inputRef} onSubmit={handleSubmit} />
        </Card>
        <button
          className="button reset-button"
          onClick={() => {
            setData(null);
            setError(null);
          }}
        >
          Reset
        </button>
      </header>
    </div>
  );
}

const Form = React.forwardRef(({ onSubmit }, inputRef) => {
  return (
    <form className="Form" onSubmit={onSubmit}>
      <label className="Form-label">
        <span>Your Email</span>
        <input ref={inputRef} type="text" name="email" />
      </label>
      <button className="button">Sign Up!</button>
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

function MessageText({ data, loading, error }) {
  return (
    <Fragment>
      {!data && !loading && <p>Check out all of the latest and greatest!</p>}
      {loading && <p>Loading...</p>}
      {data && <p>{data}</p>}
      {error && <p>{error}</p>}
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
