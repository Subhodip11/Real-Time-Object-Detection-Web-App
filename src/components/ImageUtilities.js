// creating coordinates to be plotted on video for objects to get detected
export function buildDetectedObjects(scores, threshold, boxes, classes, classesDir, video_frame) {
    const detectionObjects = [];

    scores[0].forEach((score, i) => {
        if (score >= threshold) {
            const minY = boxes[0][i][0] * video_frame.offsetHeight;
            const minX = boxes[0][i][1] * video_frame.offsetWidth;
            const maxY = boxes[0][i][2] * video_frame.offsetHeight;
            const maxX = boxes[0][i][3] * video_frame.offsetWidth;
            // console.log('(', minX, ',', minY, ')\t(', maxX, ',', maxY, ')')

            detectionObjects.push({
                class: classes[i],
                label: classesDir[classes[i]].name,
                score: score.toFixed(4),
                bbox: [minX, minY, maxX - minX, maxY - minY],
            });
        }
    });

    return detectionObjects;
}