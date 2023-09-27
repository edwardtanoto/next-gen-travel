import React from "react";
import { useRouter } from "next/navigation";
import { makePostRequest } from "../../lib/api";

const Test = () => {
  const fetchSerp = async () => {
    try {
      const serpResult = await makePostRequest(
        `${process.env.URL}/api/awsOcrOld`
      );
      return serpResult.result;
    } catch (error) {
      console.error(error);
    }
  };

  fetchSerp();

  return <span>here</span>;
};

export default Test;
