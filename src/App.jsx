import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import RealTimeDetector from "./RealTimeDetector";
import ImageRecognition from "./components/ImageRecognition";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RealTimeDetector />} />
        <Route path="/ImageRecognition" element={<ImageRecognition />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
