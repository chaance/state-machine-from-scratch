import React, { Fragment, useState } from "react";
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
          <button
            className="button fetch-button"
            onClick={() => {
              setLoading(true);
              fetch(url)
                .then(res => {
                  if (res.status !== 200) {
                    throw new Error(res.statusText);
                  }
                  if (getRandomInt(3) === 1) {
                    throw new Error("Please try your submission again later.");
                  }
                  return res.json();
                })
                .then(data => {
                  setLoading(false);
                  setData(data.title);
                })
                .catch(err => {
                  setLoading(false);
                  setError(err.message);
                });
            }}
          >
            Get My Data!
          </button>
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
      {!data && !loading && <p>Let's get some data</p>}
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

// IDLE
// LOADING
// ERROR
// SUCCESS
