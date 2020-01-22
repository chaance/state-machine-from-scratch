import React, { Fragment, useEffect, useRef, useState } from "react";
import "./App.css";

/**
 * Warning: This file is error prone on purpose!
 * This is what we see a lot of in the wild when it comes to handling
 * state in React components. Complex states existing independently
 * of one another can leave a component in multiple conflicitng states
 * at once. No good! We should refactor this so that the component
 * exists in only one state at a single point in time.
 *
 */
let user = "chancestrickland";
let repo = "state-machine-from-scratch";
let url = `https://my-json-server.typicode.com/${user}/${repo}/posts/1`;

function App() {
  let [data, setData] = useState(null);
  let [error, setError] = useState(null);
  let [loading, setLoading] = useState(false);
  let [email, setEmail] = useState("");
  let inputRef = useRef(null);

  function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    fetch(url)
      .then(res => {
        if (res.status !== 200) {
          throw new Error(res.statusText);
        }
        // just throw an error every once in a while to illustrate
        // the point
        throwRandomErrorMaybe();

        return res.json();
      })
      .then(data => {
        // this is a fake API call so we'll just append the email here
        // just to keep this moving.
        data.email = email;

        setLoading(false);
        setData(data);
        setEmail("");
      })
      .catch(err => {
        setLoading(false);
        setError(err);
      });
  }

  useEffect(() => {
    if (data) {
      console.log(data);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="App">
      <header className="App-header">
        <div className="card">
          <div className="message">
            <h3>
              {data
                ? "Thank you for signing up!"
                : error
                ? "Uh oh, something went wrong!"
                : "Sign up for our newsletter"}
            </h3>

            {!(data || data.title) && !loading && (
              <p>Check out all of the latest and greatest!</p>
            )}
            {loading && <p>Loading...</p>}
            {data && data.title && <p>{data.title}</p>}
            {error && error.message && <p>{error.message}</p>}
          </div>
          <Form
            value={email}
            setValue={setEmail}
            ref={inputRef}
            onSubmit={handleSubmit}
          />
        </div>
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

const Form = React.forwardRef(({ onSubmit, value, setValue }, inputRef) => {
  return (
    <form className="Form" onSubmit={onSubmit}>
      <label className="Form-label">
        <span>Your Email</span>
        <input
          ref={inputRef}
          value={value}
          onChange={event => setValue(event.target.value)}
          type="text"
          name="email"
        />
      </label>
      <button className="button">Sign Up!</button>
    </form>
  );
});

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
