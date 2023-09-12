import React from "react";
import Mapbox from "../../components/Mapbox";
import { useRouter } from "next/navigation";

const test = () => {
  const { push } = useRouter();

  return (
    <span
      onClick={function () {
        push({
          pathname: "/map",
          query: { location: ["Curry Hyuga, Burlingame", "Midway SF"] },
        });
      }}
    >
      here
    </span>
  );
};

export default test;
