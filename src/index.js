import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
// import App from "./App";
import ImageRecognition from "./components/ImageRecognition";

ReactDOM.render(
  <React.StrictMode>
    {/* <App /> */}
    <ImageRecognition />
  </React.StrictMode>,
  document.getElementById("root")
);
