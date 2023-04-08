import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { loadGraphModel } from "@tensorflow/tfjs-converter";
import "../App.css";
import { buildDetectedObjects } from "./ImageUtilities";
import { labelMap } from "../label_map";
import imageSrc from "../assets/images/img-w-1.jpg";

const threshold = 0.8;

function ImageRecognition() {
  const imageRef = useRef();
  const canvasRef = useRef();
  const [image, setImage] = useState(imageSrc);
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

  const detectFrame = async (image, model) => {
    try {
      tf.engine().startScope();
      if (model && image && backend.current) {
        // console.log("backend value -> " + backend.current);
        model.executeAsync(process_input(await image)).then((predictions) => {
          renderPredictions(predictions, image);
          requestAnimationFrame(() => {
            detectFrame(image, model);
          });
          tf.engine().endScope();
        });
      }
    } catch (e) {
      console.log(e);
    }
  };

  function process_input(image_frame) {
    const tfimg = tf.browser.fromPixels(image_frame).toInt();
    const expandedimg = tfimg.transpose([0, 1, 2]).expandDims();
    return expandedimg;
  }

  const renderPredictions = (predictions) => {
    try {
      const ctx = canvasRef.current.getContext("2d");
      const video_frame = document.getElementById("image_frame");
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

  const handleImageUpload = (e) => {
    const imageFile = e.target.files[0];
    const imageURL = URL.createObjectURL(imageFile);
    setImage(imageURL);
  };

  useEffect(() => {
    // console.log("Entered here in detecting");

    load_model()
      .then((model) => {
        if (model[1]) {
          backend.current = model[1];
          // console.log(backend.current);
          detectFrame(imageRef.current, model[0]);
        }
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);

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
        <div className="camera-container">
          {isReadyState && (
            <div className="upload-image">
              <input type="file" onChange={handleImageUpload} />
            </div>
          )}
          {image && (
            <img
              src={image}
              ref={imageRef}
              alt="image not found"
              style={{ height: "300px", width: "500px" }}
              className="size"
              id="image_frame"
            />
          )}
          <canvas className="size" ref={canvasRef} width="500" height="300px" />
        </div>
      </main>
    </div>
  );
}
export default ImageRecognition;
