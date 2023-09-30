import React from "react";
import { useRouter } from "next/navigation";
import { makePostRequest } from "../../lib/api";

const Test = () => {
  const fetchSerp = async () => {
    try {
      console.log("start ocr");

      const ocrResult = await makePostRequest(
        `${process.env.URL}/api/awsOcrOld`
      );
      console.log(ocrResult);
      // console.log("completed ocr");

      // const openAIResult = await await makePostRequest(
      //   `${process.env.URL}/api/openai_ocr_location`,
      //   ocrResult
      // );
      // console.log("completed openai");

      console.log(openAIResult.choices[0].message.content);
      return openAIResult.choices[0].message.content;
    } catch (error) {
      console.error(error);
    }
  };

  fetchSerp();

  return <span>here</span>;
};

export default Test;
