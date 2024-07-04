import React from "react";

export const PRODUCTS = ({ data }) => {
  return (
    <div className="product">
      <h2>{data.name}</h2>
      <p>{data.description}</p>
      <p>${data.price}</p>
      {data.image && <img src={data.image} alt={data.name} />}
    </div>
  );
};
