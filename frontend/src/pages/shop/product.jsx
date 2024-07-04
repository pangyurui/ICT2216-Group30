import React, { useContext } from "react";
import { ShopContext } from "../../context/shop-context";
import { Link } from "react-router-dom";

export const Product = ({ data }) => {
  const { id, name, price, image } = data;
  const { addToCart, cartItems } = useContext(ShopContext);

  const cartItemCount = cartItems[id] || 0;

  return (
    <div className="product">
      <Link to={`/product/${id}`}>
        <img src={image} alt={name} />
      </Link>
      <div className="description">
        <Link to={`/product/${id}`}>
          <p>
            <b>{name}</b>
          </p>
        </Link>
        <p>${price}</p>
      </div>
      <button className="addToCartBttn" onClick={() => addToCart(id)}>
        Add To Cart {cartItemCount > 0 && <> ({cartItemCount})</>}
      </button>
    </div>
  );
};
