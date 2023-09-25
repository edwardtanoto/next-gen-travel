import React from "react";
import { useRouter } from "next/navigation";
import { makePostRequest } from "../../lib/api";

const Test = () => {
  const { push } = useRouter();

  const fetchSerp = async () => {
    try {
      const serpResult = await makePostRequest(
        `${process.env.URL}/api/awsOcr`,
        "Taipei 101 Taiwan"
      );

      return serpResult.result;
    } catch (error) {
      console.error(error);
    }
  };

  fetchSerp();

  return (
    <span
    // onClick={function () {
    //   push({
    //     pathname: "/map",
    //     query: { location: ["Curry Hyuga, Burlingame", "Midway SF"] },
    //   });
    // }}
    >
      here
    </span>
  );
};

export default Test;
