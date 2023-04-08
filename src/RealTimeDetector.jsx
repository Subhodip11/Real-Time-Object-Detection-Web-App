import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { loadGraphModel } from "@tensorflow/tfjs-converter";
import "./App.css";
import { buildDetectedObjects } from "./utilities";
import { labelMap } from "./label_map";
import { Link } from "react-router-dom";

const threshold = 0.8;

function RealTimeDetector() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [camera, setCamera] = useState(null);
  const isReady = useRef(false);
  const [isReadyState, setIsReadyState] = useState(isReady.current);
  const [detecting, setDetecting] = useState(true);
  const backend = useRef(null);
  const counter = useRef(0);

  async function load_model() {
    return tf
      .ready()
      .then(async () => {
        // console.log("Backend is set");
        return [await loadGraphModel("http://127.0.0.1:8080/model.json"), true];
      })
      .catch((err) => console.log(err.message));
  }

  const detectFrame = async (video, model) => {
    try {
      tf.engine().startScope();
      if (model && video && backend.current) {
        // console.log("backend value -> " + backend.current);
        model.executeAsync(process_input(await video)).then((predictions) => {
          renderPredictions(predictions, video);
          requestAnimationFrame(() => {
            detectFrame(video, model);
          });
          tf.engine().endScope();
        });
      }
    } catch (e) {
      console.log(e);
    }
  };

  function process_input(video_frame) {
    const tfimg = tf.browser.fromPixels(video_frame).toInt();
    const expandedimg = tfimg.transpose([0, 1, 2]).expandDims();
    return expandedimg;
  }

  const renderPredictions = (predictions) => {
    try {
      const ctx = canvasRef.current.getContext("2d");
      const video_frame = document.getElementById("frame");
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      // Font options.
      const font = "16px sans-serif";
      ctx.font = font;
      ctx.textBaseline = "top";

      //checking for predictions values
      // console.log(predictions[6].arraySync());

      //Getting predictions
      const boxes = predictions[1].arraySync();
      const scores = predictions[6].arraySync();
      const classes = predictions[0].dataSync();
      const detections = buildDetectedObjects(
        scores,
        threshold,
        boxes,
        classes,
        labelMap,
        video_frame
      );

      //setting value of isReady to true for making users aware about state of backend

      isReady.current = true;
      setIsReadyState(isReady.current);
      counter.current++;
      // console.log("reached in renderPredictions Function ->" + isReady.current);

      detections.forEach((item) => {
        const x = item["bbox"][0];
        const y = item["bbox"][1];
        const width = item["bbox"][2];
        const height = item["bbox"][3];
        // console.log("x,y -> " + x + "," + y);
        // console.log("width, height -> " + width + "," + height);
        // Draw the bounding box.
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, width, height);

        // Draw the label background.
        ctx.fillStyle = labelMap[item["class"]]["color"];
        const textWidth = ctx.measureText(
          item["label"] + " " + (100 * item["score"]).toFixed(2) + "%"
        ).width;
        const textHeight = parseInt(font, 10); // base 10
        ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
      });

      detections.forEach((item) => {
        const x = item["bbox"][0];
        const y = item["bbox"][1];

        // Draw the text last to ensure it's on top.
        ctx.fillStyle = "#000000";
        ctx.fillText(
          item["label"] + " " + (100 * item["score"]).toFixed(2) + "%",
          x,
          y
        );
      });

      tf.dispose(boxes);
      tf.dispose(scores);
      tf.dispose(classes);
      tf.dispose(detections);
      tf.dispose(predictions);
      tf.dispose();
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    async function makeTFReady(model) {
      if (
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia &&
        detecting
      ) {
        navigator.mediaDevices
          .getUserMedia({
            audio: false,
            video: {
              facingMode: "user",
            },
          })
          .then((stream) => {
            setCamera(stream);

            window.stream = stream;
            videoRef.current.srcObject = stream;
            return new Promise((resolve, reject) => {
              videoRef.current.onloadedmetadata = async () => {
                // console.log("Entered in onloadedmetadata", backend);
                detectFrame(videoRef.current, model);
                resolve();
              };
            });
          })
          .catch((err) => console.log(err.message));

        // console.log("In enable Camera to set backend");
      }
    }
    if (detecting) {
      // console.log("Entered here in detecting");
      load_model()
        .then((model) => {
          if (model[1]) {
            backend.current = model[1];
            // console.log(backend.current);
            makeTFReady(model[0]);
          }
        })
        .catch((err) => {
          console.log(err.message);
        });
    } else {
      console.log("Entered in else part ");
      backend.current = null;
      isReady.current = false;
      setIsReadyState(isReady.current);
      if (camera) camera.getVideoTracks().forEach((track) => track.stop());

      tf.disposeVariables();
      tf.dispose();
    }
  }, [detecting]);

  return (
    <div className="parent-container">
      <header>
        <h1 className="heading">Real-Time Object Detection: Electronics</h1>
        <div className="sub-heading">
          Model Name :- SSD Mobilenet V2 320x320
        </div>
        <div className="sub-heading">
          Dataset : Pre-trained model trained on COCO Dataset
        </div>
        {!isReadyState ? (
          <div>Please wait, model getting ready to make predictions</div>
        ) : (
          <div>Model is Ready for predictions</div>
        )}
      </header>

      <main>
        <section>
          <Link to="/ImageRecognition">
            <span
              onClick={() => {
                delete window.tf;
                backend.current = null;
                isReady.current = false;
                setIsReadyState(isReady.current);
                if (camera)
                  camera.getVideoTracks().forEach((track) => track.stop());

                tf.disposeVariables();
                tf.dispose();
              }}
            >
              Switch to image recognition
            </span>
          </Link>
        </section>
        <div className="camera-container">
          <video
            style={{ height: "600px", width: "500px" }}
            className="size"
            autoPlay
            playsInline
            muted
            ref={videoRef}
            width="600"
            height="500"
            id="frame"
          />
          <canvas className="size" ref={canvasRef} width="600" height="500" />
        </div>
      </main>
      <section>
        <div className="others-container">
          <button
            className="controller-btn"
            onClick={() => {
              setDetecting(!detecting);
            }}
            disabled={!isReadyState && counter.current === 0}
          >
            {detecting ? "Stop Detection" : "Start Detection"}
          </button>
        </div>
      </section>
    </div>
  );
}
export default RealTimeDetector;
